import {DynamoDB} from 'aws-sdk'

const dynamoDB = new DynamoDB.DocumentClient()

const getTasks = async (userId: string) => {
    const state = await dynamoDB
        .query({
            TableName: process.env.DYNAMODB_TABLE_TASKS!,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        })
        .promise()

    return state.Items || []
}

export const handler = async (event: any) => {
    try {
        const userId = event.queryStringParameters?.userId
        if (!userId) throw new Error('Not found')

        const body = await getTasks(userId)

        return {
            statusCode: 200,
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        }
    } catch (error) {
        if (error.message === 'Not found') {
            return {
                statusCode: 404,
                body: error.message,
            }
        }

        console.error(error)

        return {
            statusCode: 500,
            body: 'Internal Server Error',
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
    }
}
