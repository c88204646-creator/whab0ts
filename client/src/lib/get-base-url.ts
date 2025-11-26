/**
 * Detecta automáticamente la URL base del cliente
 * En el navegador: siempre usa window.location.origin (la URL actual)
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Fallback para SSR (aunque no aplica en nuestro caso)
  return "http://localhost:5000";
}
