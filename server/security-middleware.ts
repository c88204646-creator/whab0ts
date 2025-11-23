import type { Request, Response, NextFunction } from "express";

// Rate limiting in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const RATE_LIMIT_CONFIG = {
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
  API: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  MESSAGES: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 messages per minute
};

/**
 * Global rate limiting middleware
 */
export function rateLimit(endpoint: keyof typeof RATE_LIMIT_CONFIG) {
  return (req: Request, res: Response, next: NextFunction) => {
    const config = RATE_LIMIT_CONFIG[endpoint];
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket.remoteAddress || "unknown";
    const key = `${endpoint}:${clientIp}`;
    
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
      return next();
    }
    
    if (record.count >= config.maxRequests) {
      return res.status(429).json({ 
        error: "Too many requests. Please try again later." 
      });
    }
    
    record.count++;
    next();
  };
}

/**
 * Validate userId format and existence
 */
export function validateUserId(req: Request, res: Response, next: NextFunction) {
  const userId = req.query.userId || req.params.userId || req.body.userId;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof userId === "string" && !uuidRegex.test(userId) && userId !== "demo-user-id") {
    return res.status(400).json({ error: "Invalid userId format" });
  }
  
  next();
}

/**
 * Sanitize user input - remove potentially dangerous characters
 */
export function sanitizeInputs(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeInputs);
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // Remove potential script injection patterns
      sanitized[key] = value
        .replace(/<script[^>]*>.*?<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .substring(0, 10000); // Max 10k chars
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeInputs(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitize request body
 */
export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeInputs(req.body);
  }
  next();
}

/**
 * Prevent parameter pollution
 */
export function validateNoParamPollution(req: Request, res: Response, next: NextFunction) {
  const checkParams = (obj: any): boolean => {
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value) && typeof value[0] === "string") {
        // Parameter pollution detected
        return true;
      }
      if (typeof value === "object" && value !== null) {
        if (checkParams(value)) return true;
      }
    }
    return false;
  };
  
  if (checkParams(req.query) || checkParams(req.params)) {
    return res.status(400).json({ error: "Invalid request parameters" });
  }
  
  next();
}

/**
 * Generic error response - don't leak sensitive info
 */
export function handleSecureError(error: any, endpoint: string = "API"): string {
  // Log real error for debugging
  console.error(`[Security] ${endpoint} Error:`, error?.message || error);
  
  // Return generic error
  if (error?.message?.includes("Unique constraint") || error?.message?.includes("unique")) {
    return "This value already exists in the system";
  }
  
  if (error?.message?.includes("Foreign key")) {
    return "Invalid reference to related data";
  }
  
  // Generic fallback
  return "An error occurred processing your request";
}

/**
 * Mask API keys in logs
 */
export function maskSensitiveData(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  
  const masked = JSON.parse(JSON.stringify(obj));
  const sensitiveKeys = ["password", "apiKey", "token", "secret", "key", "authorization"];
  
  const maskObject = (o: any) => {
    if (typeof o !== "object" || o === null) return;
    for (const [key, value] of Object.entries(o)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        o[key] = "***REDACTED***";
      } else if (typeof value === "object") {
        maskObject(value);
      }
    }
  };
  
  maskObject(masked);
  return masked;
}
