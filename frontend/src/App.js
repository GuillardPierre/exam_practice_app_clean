import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tasks from "./pages/Tasks";
import Header from "./components/Header";
import Footer from "./components/Footer";
import api, { setUnauthorizedHandler } from "./api";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setIsAuthenticated(false));

    const checkSession = async () => {
      try {
        await api.get("/auth/me");
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();

    return () => setUnauthorizedHandler(null);
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setIsAuthenticated(false);
    }
  };

  const renderProtectedTasks = () => {
    if (authLoading) {
      return <p className="empty-message">Vérification de la session...</p>;
    }
    return isAuthenticated ? <Tasks /> : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <div className="App">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main>
          <Routes>
            <Route
              path="/"
              element={<Navigate to={isAuthenticated ? "/tasks" : "/login"} replace />}
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/tasks" replace /> : <Login onLogin={handleLogin} />
              }
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/tasks" replace /> : <Register />}
            />
            <Route path="/tasks" element={renderProtectedTasks()} />
            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? "/tasks" : "/login"} replace />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
