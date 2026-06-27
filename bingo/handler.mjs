import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "BingoGrids";

export const handler = async (event) => {
    try {
        const method = event.requestContext?.http?.method || event.httpMethod;

        let response;
        switch (method) {
            case "POST":
                response = await handlePost(event);
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

        return response;
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error: error.message }),
        };
    }
};

const handlePost = async (event) => {
    if (!event.body) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing request body" }) };
    }

    const data = JSON.parse(event.body);

    if (data.action === "verify") {
        return verifyPassword(data);
    }

    return saveGrid(data);
};

const verifyPassword = async ({ username, password }) => {
    if (!username || !password) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username or password" }) };
    }

    const item = await fetchUserItem(username);
    if (!item) {
        return { statusCode: 404, body: JSON.stringify({ message: "User not found" }) };
    }

    if (!item.password) {
        return { statusCode: 403, body: JSON.stringify({ message: "No password configured for this user" }) };
    }

    if (item.password !== password) {
        return { statusCode: 401, body: JSON.stringify({ message: "Invalid password" }) };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Password verified" }),
    };
};

const saveGrid = async ({ username, grid, password }) => {
    if (!username || !grid) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username or grid" }) };
    }

    const existing = await fetchUserItem(username);

    if (password) {
        if (!existing) {
            return { statusCode: 404, body: JSON.stringify({ message: "User not found" }) };
        }
        if (!existing.password) {
            return { statusCode: 403, body: JSON.stringify({ message: "No password configured for this user" }) };
        }
        if (existing.password !== password) {
            return { statusCode: 401, body: JSON.stringify({ message: "Invalid password" }) };
        }

        const item = {
            user: username,
            grid,
            password: existing.password,
            updatedAt: new Date().toISOString(),
        };

        await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Bingo grid updated successfully" }),
        };
    }

    // No password: only allow updating checked state on existing grid
    if (!existing) {
        return { statusCode: 404, body: JSON.stringify({ message: "Bingo grid not found" }) };
    }

    const existingGrid = existing.grid || [];
    if (grid.length !== existingGrid.length) {
        return { statusCode: 403, body: JSON.stringify({ message: "Password required to modify grid content" }) };
    }

    const mergedGrid = existingGrid.map((tile, i) => ({
        qui: tile.qui,
        quoi: tile.quoi,
        checked: !!grid[i]?.checked,
    }));

    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            user: username,
            grid: mergedGrid,
            password: existing.password,
            updatedAt: new Date().toISOString(),
        },
    }));

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Checked state saved" }),
    };
};

const fetchUserItem = async (username) => {
    const result = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { user: username },
    }));
    return result.Item || null;
};

const getGrid = async (event) => {
    const username = event.queryStringParameters?.username;

    if (!username) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing username" }) };
    }

    const item = await fetchUserItem(username);

    if (!item) {
        return { statusCode: 404, body: JSON.stringify({ message: "Bingo grid not found" }) };
    }

    const { password, ...safeItem } = item;

    return {
        statusCode: 200,
        body: JSON.stringify(safeItem),
    };
};
