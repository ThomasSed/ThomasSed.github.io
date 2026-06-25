import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "BingoGrids";

export const handler = async (event) => {
    try {
        // HTTP API v2 uses event.requestContext.http.method
        // REST API v1 uses event.httpMethod
        const method = event.requestContext?.http?.method || event.httpMethod;

        let response;
        switch (method) {
            case "POST":
                response = await createGrid(event);
                break;
            case "GET":
                response = await getGrid(event);
                break;
            default:
                response = {
                    statusCode: 405,
                    body: JSON.stringify({ message: "Method Not Allowed", receivedMethod: method, eventKeys: Object.keys(event) }),
                };
        }

        return response;
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};

const createGrid = async (event) => {
    const data = JSON.parse(event.body);
    const { username, grid } = data;

    if (!username || !grid) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username or grid" }) };
    }

    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            user: username,
            grid,
            updatedAt: new Date().toISOString(),
        },
    });

    await docClient.send(command);
    return {
        statusCode: 201,
        body: JSON.stringify({ message: "Bingo grid saved successfully" }),
    };
};

const getGrid = async (event) => {
    const username = event.queryStringParameters?.username;

    if (!username) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username" }) };
    }

    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { user: username },
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
