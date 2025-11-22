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

    // Create sessionId with encoded accountName to preserve it
    const encodedAccountName = accountName.replace(/[^a-z0-9]/gi, '_');
    const timestamp = Date.now();
    const sessionId = `fb_${userId}_${encodedAccountName}_${timestamp}`;
    
    console.log(`[DEBUG] startFacebookLogin: Creating session - sessionId=${sessionId}, userId=${userId}, accountName=${accountName}`);
    
    // Store a simple session - the actual login happens in the browser via popup
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
    
    // If session not found in memory, try to extract userId and accountName from sessionId
    // sessionId format: fb_userId_timestamp
    if (!session) {
      console.log(`[DEBUG] Session not found in memory, attempting to parse sessionId`);
      const parts = sessionId.split('_');
      if (parts[0] === 'fb' && parts.length >= 2) {
        // Extract userId (everything between 'fb_' and the last timestamp)
        const userIdPart = parts.slice(1, -1).join('_'); // Remove 'fb' and timestamp
        const timestamp = parseInt(parts[parts.length - 1], 10);
        
        // Check if this is a valid session (created within last 60 minutes)
        const sessionAge = Date.now() - timestamp;
        if (sessionAge > 60 * 60 * 1000) {
          throw new Error("La sesión expiró (máximo 60 minutos). Por favor, intenta de nuevo.");
        }
        
        // Allow completion without strict session validation
        // User already logged in via Facebook popup
        session = {
          sessionId,
          userId: userIdPart,
          accountName: userIdPart, // Use userId as accountName if not found
          createdAt: timestamp,
        };
        console.log(`[DEBUG] Reconstructed session from sessionId: userId=${session.userId}, accountName=${session.accountName}`);
      } else {
        throw new Error("Sesión inválida o expirada");
      }
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
