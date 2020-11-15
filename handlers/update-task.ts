import {APIGatewayEvent} from 'aws-lambda'
import {DynamoDB} from 'aws-sdk'
import {bool} from 'aws-sdk/clients/signer'
import {v4} from 'uuid'

const dynamoDB = new DynamoDB.DocumentClient()

type TaskInput = {
    id: string
    completed: bool
}

const updateTask = async (id: string, {completed}: TaskInput) => {
    if (!id) throw new Error('Missing id')
    if (completed == null) throw new Error('Missing completed')

    const task = await dynamoDB
        .get({
            TableName: process.env.DYNAMODB_TABLE_TASKS!,
            Key: {id},
            ProjectionExpression: 'id',
        })
        .promise()

    if (!task.Item) throw new Error('Task not found')

    await dynamoDB
        .update({
            TableName: process.env.DYNAMODB_TABLE_TASKS!,
            Key: {id},
            AttributeUpdates: {
                completed: {Value: completed},
            },
        })
        .promise()

    const updatedTask = await dynamoDB
        .get({
            TableName: process.env.DYNAMODB_TABLE_TASKS!,
            Key: {id},
        })
        .promise()

    return updatedTask.Item
}

export const handler = async (event: APIGatewayEvent) => {
    try {
        if (!event.body) throw new Error('Missing body')
        if (!event.pathParameters?.id) throw new Error('Missing id')

        const task = JSON.parse(event.body)
        const body = await updateTask(event.pathParameters.id, task)

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
                body: error.message,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
        }

        return {
            statusCode: 500,
            body: 'Internal Server Error',
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
    }
}
