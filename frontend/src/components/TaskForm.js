import React, { useState } from "react";
import api from "../api";

const TaskForm = ({ addTask }) => {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Veuillez saisir un titre de tâche.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await api.post("/tasks", { title: trimmedTitle });
      addTask(res.data);
      setTitle("");
    } catch (err) {
      setError(err.response?.data?.msg || "Impossible d'ajouter la tâche.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-group" noValidate>
      <input
        type="text"
        aria-label="Nouvelle tâche"
        placeholder="Ajouter une tâche..."
        value={title}
        maxLength={120}
        required
        onChange={(e) => {
          setTitle(e.target.value);
          if (error) setError("");
        }}
      />
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn" disabled={isSubmitting} style={{ marginTop: "10px" }}>
        {isSubmitting ? "Ajout en cours..." : "Ajouter Tâche"}
      </button>
    </form>
  );
};

export default TaskForm;
