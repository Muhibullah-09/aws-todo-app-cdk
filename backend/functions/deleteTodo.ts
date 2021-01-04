import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient();

const deleteTodo = async(todoId: string) => {
    const params = {
        TableName: process.env.TODOS_TABLE || "",
        Key: {
            id: todoId
        }
    }
    try {
        await docClient.delete(params).promise()
        return todoId
    } catch (err) {
        console.log('DynamoDB error: ', err)
        return null
    }
}

export default deleteTodo;