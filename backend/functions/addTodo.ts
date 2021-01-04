import { DynamoDB } from 'aws-sdk';
const docClient = new DynamoDB.DocumentClient();
import Todo from './todo';

const addTodo = async(todo: Todo) => {
    const params = {
        TableName: process.env.TODOS_TABLE || "",
        Item: todo
    }
    try {
        await docClient.put(params).promise();
        return todo;
    } catch (err) {
        console.log('DynamoDB error: ', err);
        return null;
    }
}

export default addTodo;