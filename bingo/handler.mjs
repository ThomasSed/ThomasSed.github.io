import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "BingoGrids";

export const handler = async (event) => {
    console.log("=== INCOMING EVENT ===");
    console.log("Full event:", JSON.stringify(event, null, 2));

    try {
        const method = event.requestContext?.http?.method || event.httpMethod;
        console.log("Resolved HTTP method:", method);
        console.log("Table name:", TABLE_NAME);

        let response;
        switch (method) {
            case "POST":
                response = await createGrid(event);
                break;
            case "GET":
                response = await getGrid(event);
                break;
            default:
                console.log("Unknown method, returning 405");
                response = {
                    statusCode: 405,
                    body: JSON.stringify({ message: "Method Not Allowed", receivedMethod: method, eventKeys: Object.keys(event) }),
                };
        }

        console.log("=== RESPONSE ===", JSON.stringify(response));
        return response;
    } catch (error) {
        console.error("=== UNHANDLED ERROR ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Full error:", JSON.stringify(error, null, 2));
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};

const createGrid = async (event) => {
    console.log("=== CREATE GRID ===");
    console.log("Raw body:", event.body);

    const data = JSON.parse(event.body);
    console.log("Parsed data:", JSON.stringify(data));

    const { username, grid } = data;
    console.log("Username:", username, "| Grid items count:", grid?.length);

    if (!username || !grid) {
        console.log("Validation failed: missing username or grid");
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username or grid" }) };
    }

    const item = {
        user: username,
        grid,
        updatedAt: new Date().toISOString(),
    };
    console.log("DynamoDB PutCommand item:", JSON.stringify(item));

    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
    });

    const result = await docClient.send(command);
    console.log("DynamoDB PutCommand result:", JSON.stringify(result));

    return {
        statusCode: 201,
        body: JSON.stringify({ message: "Bingo grid saved successfully" }),
    };
};

const getGrid = async (event) => {
    console.log("=== GET GRID ===");
    console.log("queryStringParameters:", JSON.stringify(event.queryStringParameters));

    const username = event.queryStringParameters?.username;
    console.log("Username extracted:", username);

    if (!username) {
        console.log("Validation failed: missing username");
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username" }) };
    }

    const key = { user: username };
    console.log("DynamoDB GetCommand key:", JSON.stringify(key));

    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: key,
    });

    const result = await docClient.send(command);
    console.log("DynamoDB GetCommand result:", JSON.stringify(result));

    if (!result.Item) {
        console.log("No item found for user:", username);
        return { statusCode: 404, body: JSON.stringify({ message: "Bingo grid not found" }) };
    }

    console.log("Item found, returning grid with", result.Item.grid?.length, "items");
    return {
        statusCode: 200,
        body: JSON.stringify(result.Item),
    };
};
