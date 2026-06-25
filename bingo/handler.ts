import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Default to a specific table name or allow overriding via environment variables
const TABLE_NAME = process.env.TABLE_NAME || "BingoGrids";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Or specify your frontend URL if you want to be strict
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const method = event.httpMethod;

        // Handle CORS Preflight request
        if (method === "OPTIONS") {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: "",
            };
        }

        let response: APIGatewayProxyResult;

        switch (method) {
            case "POST":
                response = await createGrid(event);
                break;
            case "PUT":
            case "PATCH":
                response = await updateGrid(event);
                break;
            case "GET":
                response = await getGrid(event);
                break;
            default:
                response = {
                    statusCode: 405,
                    body: JSON.stringify({ message: "Method Not Allowed" }),
                };
        }

        // Inject CORS headers into every response
        return {
            ...response,
            headers: {
                ...corsHeaders,
                ...(response.headers || {})
            }
        };
    } catch (error) {
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};

const createGrid = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing request body" }) };
    }

    const data = JSON.parse(event.body);
    const { username, grid } = data;

    if (!username || !grid) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username or grid" }) };
    }

    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            username: username,
            grid: grid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        // Ensure we don't accidentally overwrite an existing grid on creation
        ConditionExpression: "attribute_not_exists(username)",
    });

    try {
        await docClient.send(command);
        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Bingo grid created successfully" }),
        };
    } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
            return { statusCode: 409, body: JSON.stringify({ message: "Grid already exists for this username" }) };
        }
        throw error;
    }
};

const updateGrid = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing request body" }) };
    }

    const data = JSON.parse(event.body);
    const { username, grid } = data;

    if (!username || !grid) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username or grid" }) };
    }

    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { username },
        UpdateExpression: "set grid = :g, updatedAt = :u",
        ExpressionAttributeValues: {
            ":g": grid,
            ":u": new Date().toISOString(),
        },
        ConditionExpression: "attribute_exists(username)", // Only update if it already exists
        ReturnValues: "ALL_NEW",
    });

    try {
        const result = await docClient.send(command);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Bingo grid updated successfully", data: result.Attributes }),
        };
    } catch (error: any) {
         if (error.name === "ConditionalCheckFailedException") {
            return { statusCode: 404, body: JSON.stringify({ message: "Grid not found for this username" }) };
        }
        throw error;
    }
};

const getGrid = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const username = event.queryStringParameters?.username;

    if (!username) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username in query parameters" }) };
    }

    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { username },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
        return { statusCode: 404, body: JSON.stringify({ message: "Bingo grid not found" }) };
    }

    return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
    };
};
