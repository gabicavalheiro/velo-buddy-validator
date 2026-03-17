// Ponto de entrada da aplicação React; monta o componente <App /> na página.
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
