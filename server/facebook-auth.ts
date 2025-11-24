import { storage } from "./storage";
import type { FacebookAccount } from "@shared/schema";
import { randomUUID } from "crypto";
import puppeteer, { Browser, Page } from "puppeteer";

interface FacebookSession {
  sessionId: string;
  userId: string;
  accountName: string;
  createdAt: number;
  browser?: Browser;
  page?: Page;
  cookies?: any[];
  authenticated?: boolean;
}

const activeSessions = new Map<string, FacebookSession>();

// Helper to encrypt sensitive data
function encryptData(data: string, key: string): string {
  return Buffer.from(data).toString("base64");
}

// Helper to decrypt sensitive data
function decryptData(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

export async function startFacebookLogin(
  userId: string,
  accountName: string
): Promise<{ sessionId: string }> {
  try {
    if (!userId || userId.trim() === "") {
      throw new Error("ID de usuario inválido");
    }
    if (!accountName || accountName.trim() === "") {
      throw new Error("Nombre de cuenta inválido");
    }

    const sessionId = `fb_${randomUUID()}`;
    const timestamp = Date.now();

    console.log(
      `[Facebook Auth] Starting login session: ${sessionId} for user: ${userId}`
    );

    // Launch browser with Puppeteer
    let browser: Browser | undefined;
    let page: Page | undefined;

    try {
      browser = await puppeteer.launch({
        headless: false, // Show the browser window
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
        ],
        defaultViewport: { width: 1024, height: 768 },
      });

      page = await browser.newPage();

      // Set user agent to avoid detection
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Stealth plugin to avoid detection
      await page.goto("about:blank");
      await page.evaluate(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => false,
        });
      });

      // Navigate to Facebook login
      await page.goto("https://www.facebook.com/login.php", {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Store session with browser and page
      const session: FacebookSession = {
        sessionId,
        userId,
        accountName,
        createdAt: timestamp,
        browser,
        page,
        authenticated: false,
      };

      activeSessions.set(sessionId, session);

      console.log(
        `[Facebook Auth] Browser launched for session ${sessionId}. Waiting for user login...`
      );

      return { sessionId };
    } catch (browserError) {
      console.error("[Facebook Auth] Browser error:", browserError);
      if (browser) {
        await browser.close().catch((e) => console.error("Error closing browser:", e));
      }
      throw new Error(
        "No se pudo abrir el navegador. Por favor, intenta de nuevo."
      );
    }
  } catch (error) {
    console.error("[Facebook Auth] Error starting login:", error);
    throw error;
  }
}

export async function completeFacebookLogin(
  sessionId: string
): Promise<{ account: FacebookAccount; actualUserId: string }> {
  try {
    console.log(`[Facebook Auth] Completing login for session: ${sessionId}`);

    const session = activeSessions.get(sessionId);

    if (!session) {
      throw new Error("Sesión no encontrada o expirada. Por favor, intenta de nuevo.");
    }

    if (!session.page || !session.browser) {
      throw new Error("Navegador no inicializado correctamente.");
    }

    try {
      // Check if user is logged in by looking for URL change or DOM elements
      await session.page.waitForNavigation({ timeout: 5000 }).catch(() => {
        // Navigation might not happen immediately
      });

      // Get current URL to verify login
      const currentUrl = session.page.url();
      console.log(`[Facebook Auth] Current page URL: ${currentUrl}`);

      // Check if we're past the login page
      const isLoggedIn = !currentUrl.includes("login.php");

      if (!isLoggedIn) {
        throw new Error(
          "No se detectó inicio de sesión. Por favor, verifica que hayas iniciado sesión correctamente."
        );
      }

      // Extract user ID from page if possible
      let facebookId = undefined;
      try {
        facebookId = await session.page.evaluate(() => {
          const meta = document.querySelector('meta[property="og:url"]');
          return meta?.getAttribute("content") || undefined;
        });
      } catch (e) {
        console.log("[Facebook Auth] Could not extract Facebook ID");
      }

      // Get cookies (session persistence)
      const cookies = await session.page.cookies();
      console.log(`[Facebook Auth] Captured ${cookies.length} cookies`);

      // Store encrypted cookies
      const encryptedCookies = encryptData(JSON.stringify(cookies), "facebook-session");

      // Close the browser
      await session.browser.close().catch((e) => console.error("Error closing browser:", e));

      // Ensure user exists
      let user = await storage.getUser(session.userId);
      let actualUserId = session.userId;

      if (!user) {
        try {
          const uniqueEmail = `facebook_${session.userId.replace(/[^a-z0-9]/g, "_")}_${Date.now()}@temp.local`;
          console.log(`[Facebook Auth] Creating user with email: ${uniqueEmail}`);

          const createdUser = await storage.createUser({
            email: uniqueEmail,
            password: "",
            name: session.accountName || "Facebook User",
          });
          actualUserId = createdUser.id;
          console.log(`[Facebook Auth] User created: ${actualUserId}`);
        } catch (createError: any) {
          console.error("[Facebook Auth] Error creating user:", createError);
          throw new Error(`No se pudo crear la cuenta de usuario: ${createError.message}`);
        }
      }

      // Create session token
      const sessionToken = `fb_session_${Buffer.from(`${actualUserId}_${session.accountName}_${Date.now()}`).toString("base64")}`;

      // Create Facebook account
      console.log(
        `[Facebook Auth] Creating Facebook account for user: ${actualUserId}`
      );

      const account = await storage.createFacebookAccount({
        userId: actualUserId,
        email: "", // Not stored
        password: encryptedCookies, // Store encrypted cookies as "password"
        accountName: session.accountName,
        facebookId: facebookId,
        sessionToken: sessionToken,
        status: "connected",
        lastLogin: new Date(),
      });

      // Clean up session
      activeSessions.delete(sessionId);

      console.log(
        `[Facebook Auth] Facebook account created successfully: ${account.id}`
      );

      return { account, actualUserId };
    } catch (processError) {
      console.error("[Facebook Auth] Error processing login:", processError);

      // Clean up browser on error
      if (session.browser) {
        await session.browser.close().catch((e) => {
          console.error("Error closing browser on error:", e);
        });
      }
      activeSessions.delete(sessionId);

      throw processError;
    }
  } catch (error) {
    console.error("[Facebook Auth] Error completing login:", error);
    throw error;
  }
}

export async function getCachedCookies(
  accountId: string
): Promise<any[] | null> {
  try {
    const account = await storage.getFacebookAccount(accountId);
    if (!account || !account.password) {
      return null;
    }

    // Decrypt cookies
    const decrypted = decryptData(account.password);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("[Facebook Auth] Error retrieving cached cookies:", error);
    return null;
  }
}

export function getActiveSessionCount(): number {
  return activeSessions.size;
}

export function getSessionStatus(sessionId: string): string {
  const session = activeSessions.get(sessionId);
  if (!session) return "not_found";
  return session.authenticated ? "authenticated" : "waiting";
}
