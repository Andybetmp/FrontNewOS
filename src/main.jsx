import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/* La identidad de RENASER OS. Va primero: todo lo demás lee sus variables. */
import "./estilo/tokens.css";
import "./estilo/base.css";

ReactDOM.createRoot(document.getElementById("raiz")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
