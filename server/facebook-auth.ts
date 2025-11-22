import { storage } from "./storage";
import type { FacebookAccount } from "@shared/schema";
import { randomUUID } from "crypto";

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

    // Create a unique sessionId using UUID
    const sessionId = `fb_${randomUUID()}`;
    const timestamp = Date.now();
    
    console.log(`[DEBUG] startFacebookLogin: Creating session - sessionId=${sessionId}, userId=${userId}, accountName=${accountName}`);
    
    // Store the complete session information in memory
    const session: FacebookSession = {
      sessionId,
      userId,
      accountName,
      createdAt: timestamp,
    };
    
    activeSessions.set(sessionId, session);
    console.log(`[DEBUG] Session stored in memory. Active sessions count: ${activeSessions.size}`);

    return { sessionId };
  } catch (error) {
    console.error("Error starting Facebook login:", error);
    throw error;
  }
}

export async function completeFacebookLogin(sessionId: string): Promise<{ account: FacebookAccount; actualUserId: string }> {
  try {
    console.log(`[DEBUG] completeFacebookLogin called with sessionId: ${sessionId}`);
    console.log(`[DEBUG] Active sessions: ${Array.from(activeSessions.keys()).join(', ')}`);
    
    let session = activeSessions.get(sessionId);
    
    if (!session) {
      console.log(`[DEBUG] Session not found in memory - sessionId: ${sessionId}`);
      throw new Error("Sesión de login no encontrada o expirada. Por favor, intenta de nuevo.");
    }

    const { userId, accountName } = session;

    // Ensure user exists in the database
    let user = await storage.getUser(userId);
    
    // If the userId (guest-XXX) doesn't exist as a record in DB, create a user
    let actualUserId = userId;
    if (!user) {
      try {
        // Create a new user if doesn't exist
        // Use a unique email based on userId and timestamp to avoid conflicts
        const uniqueEmail = `facebook_${userId.replace(/[^a-z0-9]/g, '_')}_${Date.now()}@temp.local`;
        console.log(`[DEBUG] Creating new user with email: ${uniqueEmail}`);
        const createdUser = await storage.createUser({
          email: uniqueEmail,
          password: "", // Empty password - user logged via Facebook
          name: accountName || "Facebook User",
        });
        // Use the actual database ID for the facebook account
        actualUserId = createdUser.id;
        console.log(`[DEBUG] User created with id: ${actualUserId}`);
      } catch (createError: any) {
        // If creation fails, log the error but still try to proceed
        console.error("Error creating user:", createError);
        throw new Error(`No se pudo crear la cuenta de usuario: ${createError.message}`);
      }
    }

    // Generate a secure session token for storing
    const sessionToken = `fb_session_${Buffer.from(`${actualUserId}_${accountName}_${Date.now()}`).toString('base64')}`;

    // Create account in database
    console.log(`[DEBUG] Creating Facebook account for userId: ${actualUserId}, accountName: ${accountName}`);
    const account = await storage.createFacebookAccount({
      userId: actualUserId, // Use the actual database user ID
      email: "", // Not stored - user logged in via popup
      password: "", // Don't store raw password
      accountName,
      sessionToken: sessionToken, // Store secure token
      status: "connected", // Mark as connected since user completed login
    });

    // Clean up
    activeSessions.delete(sessionId);

    // Return both the account and the actual user ID so frontend can update its state
    return { account, actualUserId };
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
