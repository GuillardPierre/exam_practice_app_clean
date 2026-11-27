import "@testing-library/jest-dom";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TaskForm from "./components/TaskForm";
import Login from "./pages/Login";
import api from "./api";

jest.mock("./api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  setUnauthorizedHandler: jest.fn(),
}));

describe("Formulaires TaskForm et Login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("bloque l'ajout d'une tâche vide", () => {
    const addTask = jest.fn();
    render(<TaskForm addTask={addTask} />);

    fireEvent.click(screen.getByRole("button", { name: /ajouter tâche/i }));

    expect(screen.getByRole("alert")).toHaveTextContent("Veuillez saisir un titre de tâche.");
    expect(api.post).not.toHaveBeenCalled();
    expect(addTask).not.toHaveBeenCalled();
  });

  test("ajoute une tâche valide", async () => {
    const createdTask = { _id: "1", title: "Réviser l'examen", isCompleted: false };
    api.post.mockResolvedValueOnce({ data: createdTask });
    const addTask = jest.fn();

    render(<TaskForm addTask={addTask} />);

    fireEvent.change(screen.getByLabelText("Nouvelle tâche"), {
      target: { value: "  Réviser l'examen  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /ajouter tâche/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/tasks", { title: "Réviser l'examen" });
    });
    expect(addTask).toHaveBeenCalledWith(createdTask);
  });

  test("bloque un login vide", () => {
    render(
      <MemoryRouter>
        <Login onLogin={jest.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Veuillez renseigner votre nom d'utilisateur et votre mot de passe."
    );
    expect(api.post).not.toHaveBeenCalled();
  });
});
