/**
 * Detecta automáticamente la URL base del servidor
 * Prioridad: APP_URL (producción) > AUTO-DETECT > localhost fallback
 */
export function getBaseUrl(req?: any): string {
  // 1. Si APP_URL está configurada (producción/deployment)
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }

  // 2. Auto-detectar de los headers de la solicitud (si existe)
  if (req && req.headers && req.headers.host) {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers.host;
    return `${protocol}://${host}`;
  }

  // 3. Auto-detectar de REPLIT_DOMAINS o REPL_ID
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(",")[0];
    return `https://${domain}`;
  }

  if (process.env.REPL_ID) {
    const username = process.env.REPLIT_DOMAINS?.includes("@") 
      ? process.env.REPLIT_DOMAINS.split("@")[0] 
      : "unknown";
    return `https://${process.env.REPL_ID}-${username}.repl.co`;
  }

  // 4. Fallback: localhost para desarrollo local
  const port = process.env.PORT || "5000";
  return `http://localhost:${port}`;
}
