import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import TaskForm from "../components/TaskForm";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setError("");
        const res = await api.get("/tasks");
        setTasks(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
          return;
        }
        setError(err.response?.data?.msg || "Impossible de charger vos tâches.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [navigate]);

  const addTask = (newTask) => {
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  const toggleTask = async (task) => {
    try {
      setError("");
      const res = await api.put(`/tasks/${task._id}`, {
        isCompleted: !task.isCompleted,
      });
      setTasks((prevTasks) => prevTasks.map((item) => (item._id === task._id ? res.data : item)));
    } catch (err) {
      setError(err.response?.data?.msg || "Impossible de mettre à jour la tâche.");
    }
  };

  const deleteTask = async (id) => {
    try {
      setError("");
      await api.delete(`/tasks/${id}`);
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));
    } catch (err) {
      setError(err.response?.data?.msg || "Impossible de supprimer la tâche.");
    }
  };

  return (
    <div className="container">
      <h1>Mes Tâches</h1>
      <TaskForm addTask={addTask} />

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="empty-message">Chargement des tâches...</p>
      ) : tasks.length === 0 ? (
        <p className="empty-message">Aucune tâche pour le moment.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task._id} className={`task-item ${task.isCompleted ? "completed" : ""}`}>
              <label className="task-content">
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => toggleTask(task)}
                />
                <span>{task.title}</span>
              </label>
              <button type="button" onClick={() => deleteTask(task._id)}>
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Tasks;
