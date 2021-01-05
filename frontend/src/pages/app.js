import React, { useState, useRef, useEffect, useContext } from "react";
import { Router } from "@reach/router";
import { addTodo } from "../graphql/mutations";
import { getTodos } from "../graphql/queries";
import { deleteTodo } from "../graphql/mutations";
import { API } from "aws-amplify";
import { IdentityContext } from "../../Identity-Context";
import Navbar from "../components/Navbar";
import { Link } from 'gatsby';
import { Box, Button, Container, Flex, Heading, Input, Label, NavLink } from "theme-ui";

const Dash = () => {
    const { user } = useContext(IdentityContext);
    const [loading, setLoading] = useState(true)
    const [todoData, setTodoData] = useState(null)
    const todoTitleRef = useRef("")

    const addTodoMutation = async () => {
        try {
            const todo = {
                id: 'mk' + Math.random(),
                title: todoTitleRef.current.value,
            }
            await API.graphql({
                query: addTodo,
                variables: {
                    todo: todo,
                },
            })
            todoTitleRef.current.value = ""
            fetchTodos();
        } catch (e) {
            console.log(e)
        }
    }

    const fetchTodos = async () => {
        try {
            const data = await API.graphql({
                query: getTodos,
            })
            setTodoData(data);
            console.log(data);
            setLoading(false)
        } catch (e) {
            console.log(e)
        }
    }
    useEffect(() => {
        fetchTodos()
    }, [])
    return (
        <div>
            {loading ? (
                <h1>Loading ...</h1>
            ) : (
                    <div>
                        <Navbar />
                        <label>
                            Todo:
                        <input ref={todoTitleRef} />
                        </label>
                        <button onClick={() => addTodoMutation()}>Create Todo</button>
                        {todoData.data &&
                            todoData.data.getTodos.filter((todo) => todo.user === user.username).map((item, ind) => (
                                <div style={{ marginLeft: "1rem", marginTop: "2rem" }} key={ind}>
                                    {item.title}
                                    <div>
                                        <button onClick={async e => {
                                            e.preventDefault();
                                            await API.graphql({
                                                query: deleteTodo,
                                                variables: { todoId: item.id },
                                            })
                                            fetchTodos();
                                        }}
                                        >Delete</button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
        </div>
    );
};

const App = () => {
    const { user } = useContext(IdentityContext);
    return (
        <>
            <Router>{user && <Dash path="/app" />}</Router>
            {!user && <NavLink as={Link} to="/" p={2}>Home</NavLink>}
        </>)
};

export default App;