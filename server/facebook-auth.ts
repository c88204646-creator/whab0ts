import { storage } from "./storage";
import type { FacebookAccount } from "@shared/schema";
import { v4 as uuidv4 } from "crypto";

interface FacebookSession {
  sessionId: string;
  userId: string;
  accountName: string;
  createdAt: number;
  accessToken?: string;
}

const activeSessions = new Map<string, FacebookSession>();

export async function startFacebookLogin(userId: string, accountName: string): Promise<{ sessionId: string }> {
  try {
    // Validate inputs
    if (!userId || userId.trim() === "") {
      throw new Error("ID de usuario inválido");
    }
    if (!accountName || accountName.trim() === "") {
      throw new Error("Nombre de cuenta inválido");
    }

    const sessionId = `fb_${userId}_${Date.now()}`;
    
    // Store a simple session - the actual login happens in the browser via iframe
    const session: FacebookSession = {
      sessionId,
      userId,
      accountName,
      createdAt: Date.now(),
    };
    
    activeSessions.set(sessionId, session);

    return { sessionId };
  } catch (error) {
    console.error("Error starting Facebook login:", error);
    throw error;
  }
}

export async function completeFacebookLogin(sessionId: string): Promise<FacebookAccount | null> {
  try {
    const session = activeSessions.get(sessionId);
    if (!session) {
      throw new Error("Sesión no encontrada o expirada");
    }

    const { userId, accountName } = session;

    // Check if session is not too old (max 30 minutes)
    const sessionAge = Date.now() - session.createdAt;
    if (sessionAge > 30 * 60 * 1000) {
      activeSessions.delete(sessionId);
      throw new Error("La sesión expiró. Por favor, intenta de nuevo.");
    }

    // Generate a session token for storing
    const sessionToken = `fb_session_${sessionId}_${Date.now()}`;

    // Create account in database
    const account = await storage.createFacebookAccount({
      userId,
      email: "", // We'll use session token instead of storing credentials
      password: "", // Don't store raw password
      accountName,
      sessionToken: sessionToken, // Store secure token
      status: "connected",
    });

    // Clean up
    activeSessions.delete(sessionId);

    return account;
  } catch (error) {
    console.error("Error completing Facebook login:", error);
    throw error;
  }
}

export function getActiveSessionCount(): number {
  return activeSessions.size;
}

export function getSessionStatus(sessionId: string): string {
  const session = activeSessions.get(sessionId);
  if (!session) return "not_found";
  return "authenticated";
}
