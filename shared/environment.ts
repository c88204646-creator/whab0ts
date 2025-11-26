/**
 * Sistema universal de detección de entorno
 * Se usa en Cliente y Servidor para detectar si estamos en producción, desarrollo o staging
 */

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  environment: "development" | "production" | "staging";
  nodeEnv: string;
  appUrl: string;
  appName: string;
  version: string;
}

/**
 * Detecta el entorno automáticamente
 * Servidor: Usa NODE_ENV + APP_URL
 * Cliente: Usa window.location
 */
export function detectEnvironment(): EnvironmentConfig {
  // En el servidor (Node.js)
  if (typeof process !== "undefined" && process.versions?.node) {
    const nodeEnv = process.env.NODE_ENV || "development";
    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
    
    const isDevelopment = nodeEnv === "development" || appUrl.includes("localhost");
    const isProduction = nodeEnv === "production" && !appUrl.includes("localhost");
    const isStaging = nodeEnv === "staging" || (appUrl.includes("preview") && !isDevelopment);
    
    const environment = isProduction ? "production" : isStaging ? "staging" : "development";

    return {
      isDevelopment,
      isProduction,
      isStaging,
      environment,
      nodeEnv,
      appUrl: appUrl.replace(/\/$/, ""),
      appName: "WhatsApp CRM",
      version: "1.0.0",
    };
  }

  // En el navegador (Browser)
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const isDevelopment = origin.includes("localhost") || origin.includes("127.0.0.1");
    const isProduction = origin.includes("whatsbot.lat") || origin.includes(".replit.dev") || (!isDevelopment && !origin.includes("preview"));
    const isStaging = !isDevelopment && !isProduction && origin.includes("preview");
    
    const environment = isProduction ? "production" : isStaging ? "staging" : "development";

    return {
      isDevelopment,
      isProduction,
      isStaging,
      environment,
      nodeEnv: isDevelopment ? "development" : isProduction ? "production" : "staging",
      appUrl: origin,
      appName: "WhatsApp CRM",
      version: "1.0.0",
    };
  }

  // Fallback
  return {
    isDevelopment: true,
    isProduction: false,
    isStaging: false,
    environment: "development",
    nodeEnv: "development",
    appUrl: "http://localhost:5000",
    appName: "WhatsApp CRM",
    version: "1.0.0",
  };
}

// Cache the environment config
let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironment(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = detectEnvironment();
  }
  return cachedConfig;
}

// Exports para uso conveniente
export const environment = getEnvironment();
export const isDev = environment.isDevelopment;
export const isProd = environment.isProduction;
export const isStaging = environment.isStaging;
export const appUrl = environment.appUrl;
