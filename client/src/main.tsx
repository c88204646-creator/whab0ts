import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Protección contra inspección de código y dev tools
(function() {
  // Deshabilitar clic derecho (Inspect)
  document.addEventListener('contextmenu', (e) => e.preventDefault(), false);
  
  // Deshabilitar F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && e.key === 'I') ||
      (e.ctrlKey && e.shiftKey && e.key === 'J') ||
      (e.ctrlKey && e.shiftKey && e.key === 'C') ||
      (e.ctrlKey && e.key === 'u')
    ) {
      e.preventDefault();
      return false;
    }
  }, false);
  
  // Detectar y bloquear herramientas de desarrollo abiertas
  let devToolsOpen = false;
  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold) {
      if (!devToolsOpen) {
        devToolsOpen = true;
        console.clear();
        console.log('%cAcceso denegado', 'font-size: 30px; color: red; font-weight: bold;');
        console.log('%cNo está permitido inspeccionar esta aplicación', 'font-size: 16px; color: red;');
      }
    } else {
      devToolsOpen = false;
    }
  }, 500);
  
  // Mostrar advertencia en console
  if (typeof console !== 'undefined') {
    console.log('%c⚠ ADVERTENCIA', 'font-size: 20px; color: red;');
    console.log('%cNo inspecciones ni modifiques esta aplicación', 'font-size: 14px; color: red;');
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
