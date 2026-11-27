import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ isAuthenticated, onLogout }) => {
  return (
    <header className="header">
      <nav aria-label="Navigation principale">
        <ul className="nav-list">
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/tasks" className="nav-link">
                  Mes Tâches
                </Link>
              </li>
              <li className="nav-item">
                <button type="button" onClick={onLogout} className="nav-link">
                  Déconnexion
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link">
                  Connexion
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link">
                  Inscription
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
