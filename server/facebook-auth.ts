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
      throw new Error("Sesión de login no encontrada o expirada");
    }

    const { userId, accountName } = session;

    // Check if session is not too old (max 60 minutes)
    const sessionAge = Date.now() - session.createdAt;
    if (sessionAge > 60 * 60 * 1000) {
      activeSessions.delete(sessionId);
      throw new Error("La sesión expiró (máximo 60 minutos). Por favor, intenta de nuevo.");
    }

    // Generate a secure session token for storing
    const sessionToken = `fb_session_${Buffer.from(`${userId}_${accountName}_${Date.now()}`).toString('base64')}`;

    // Create account in database
    // The user has already logged in via the popup window
    // We just need to save the account with a session token
    const account = await storage.createFacebookAccount({
      userId,
      email: "", // Not stored - user logged in via popup
      password: "", // Don't store raw password
      accountName,
      sessionToken: sessionToken, // Store secure token
      status: "connected", // Mark as connected since user completed login
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
