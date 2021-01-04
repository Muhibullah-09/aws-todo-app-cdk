import React, { useState, useRef, useEffect } from "react";
import { addTodo } from "../graphql/mutations";
import { getTodos } from "../graphql/queries";
import { deleteTodo } from "../graphql/mutations";
import { API } from "aws-amplify";

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [todoData, setTodoData] = useState<any>(null)
  const todoTitleRef = useRef<any>("")

  const addTodoMutation = async () => {
    try {
      const todo = {
        id: 'mk' + Math.random(),
        title: todoTitleRef.current.value,
      }
      const data = await API.graphql({
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
            <label>
              Todo:
            <input ref={todoTitleRef} />
            </label>
            <button onClick={() => addTodoMutation()}>Create Todo</button>
            {todoData.data &&
              todoData.data.getTodos.map((item, ind) => (
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
  )
}