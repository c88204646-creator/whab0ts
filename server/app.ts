import { type Server } from "node:http";
import fs from "node:fs";
import path from "node:path";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import session from "express-session";

import { registerRoutes } from "./routes";
import { rateLimit, sanitizeBody, validateNoParamPollution } from "./security-middleware";

// Extend session data
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
  limit: "10mb", // Prevent large payload attacks
}));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Global security middleware
app.use(validateNoParamPollution); // Prevent parameter pollution
app.use(sanitizeBody); // Sanitize all inputs

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "whatsapp-crm-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Security headers middleware - Protección de código fuente
app.use((req, res, next) => {
  // Remover headers que revelen información de la plataforma
  res.removeHeader("X-Powered-By");
  res.removeHeader("Server");
  
  // Headers de seguridad para proteger contra inspección
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Permitir SAMEORIGIN para desarrollo en Replit (iframe preview)
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  // Deshabilitar source maps en respuestas HTML
  if (req.path === "/" || req.path.endsWith(".html")) {
    res.setHeader("Content-Security-Policy", 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https: wss:; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "frame-ancestors 'self'; " +
      "base-uri 'self'; " +
      "form-action 'self';"
    );
  }
  
  next();
});

// Servir archivos PWA
app.get("/manifest.json", (_req, res) => {
  try {
    const manifestPath = path.resolve(import.meta.dirname, "..", "public", "manifest.json");
    const manifest = fs.readFileSync(manifestPath, "utf-8");
    res.setHeader("Content-Type", "application/manifest+json");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(manifest);
  } catch (error) {
    res.status(404).json({ error: "manifest not found" });
  }
});

app.get("/sw.js", (_req, res) => {
  try {
    const swPath = path.resolve(import.meta.dirname, "..", "public", "sw.js");
    const sw = fs.readFileSync(swPath, "utf-8");
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(sw);
  } catch (error) {
    res.status(404).json({ error: "service worker not found" });
  }
});

// Protección contra acceso a archivos sensibles (solo en producción)
if (process.env.NODE_ENV !== "development") {
  app.use((req, res, next) => {
    const sensitivePatterns = [
      /\.map$/,
      /\.env/,
      /\.git/,
      /\.md$/,
      /node_modules/,
      /src\//,
      /server\//,
      /config\//,
    ];
    
    if (sensitivePatterns.some(pattern => pattern.test(req.path))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    
    next();
  });
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
}
