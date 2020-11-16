import {DynamoDB} from 'aws-sdk'
import {v4} from 'uuid'
import {APIGatewayEvent} from 'aws-lambda'

const dynamoDB = new DynamoDB.DocumentClient()

type TaskInput = {
    userId: string
    label: string
}

const insertTask = async ({userId, label}: TaskInput) => {
    if (!userId) throw new Error('Missing userId')
    if (!label) throw new Error('Missing label')

    const newTask = {
        id: v4(),
        userId,
        label,
        completed: false,
    }

    await dynamoDB
        .put({
            TableName: process.env.DYNAMODB_TABLE_TASKS!,
            Item: newTask,
        })
        .promise()

    return newTask
}

export const handler = async (event: APIGatewayEvent) => {
    try {
        if (!event.body) throw new Error('Missing body')

        const task = JSON.parse(event.body)
        const body = await insertTask(task)

        return {
            statusCode: 200,
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        }
    } catch (error) {
        console.error(error)

        if (error.message) {
            return {
                statusCode: 500,
                body: JSON.stringify({message: error.message}),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
        }

        return {
            statusCode: 500,
            body: JSON.stringify({message: 'Internal Server Error'}),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
    }
}
