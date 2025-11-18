const AWS = require("aws-sdk");

// DynamoDB client
const dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || "ap-south-1",
});

// Lambda handler
exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    try {
        // Determine table
        // Option 1: table name passed as query param or in body
        let tableName = event.queryStringParameters?.tableName;
        if (!tableName && event.body) {
            const body = JSON.parse(event.body);
            tableName = body.tableName;
        }

        if (!tableName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing tableName" }),
            };
        }

        // Example: GET item
        if (event.httpMethod === "GET") {
            const id = event.queryStringParameters?.id;
            if (!id) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Missing id parameter" }),
                };
            }

            const params = {
                TableName: tableName,
                Key: { id },
            };

            const result = await dynamoDb.get(params).promise();

            return {
                statusCode: 200,
                body: JSON.stringify(result.Item || {}),
            };
        }

        // Example: POST item
        if (event.httpMethod === "POST") {
            const body = JSON.parse(event.body);
            if (!body.id) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Missing id in body" }),
                };
            }

            const params = {
                TableName: tableName,
                Item: body,
            };

            await dynamoDb.put(params).promise();

            return {
                statusCode: 201,
                body: JSON.stringify({ message: "Item created", item: body }),
            };
        }

        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error", error }),
        };
    }
};
