import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Security notice in console
if (typeof console !== 'undefined') {
  console.log('%c⚠ ADVERTENCIA', 'font-size: 20px; color: red;');
  console.log('%cEsta es una aplicación protegida', 'font-size: 14px; color: red;');
}

createRoot(document.getElementById("root")!).render(<App />);
