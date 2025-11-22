import { storage } from "./storage";
import type { FacebookAccount } from "@shared/schema";
import { chromium } from "playwright";

interface AutomationRequest {
  postUrl: string;
  selectedAccounts: string[];
  actionType: "like" | "comment" | "react";
  commentText?: string;
  commentType?: string;
}

interface AutomationResult {
  accountId: string;
  accountName: string;
  success: boolean;
  message: string;
}

async function commentOnPost(
  postUrl: string,
  commentText: string,
  account: FacebookAccount
): Promise<boolean> {
  let browser = null;
  try {
    console.log(`[PLAYWRIGHT] Starting browser for account: ${account.accountName}`);
    
    browser = await chromium.launch({ headless: true });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    console.log(`[PLAYWRIGHT] Navigating to post: ${postUrl}`);
    await page.goto(postUrl, { waitUntil: "networkidle", timeout: 30000 });
    
    // Wait for comment box to be available
    console.log(`[PLAYWRIGHT] Looking for comment box...`);
    const commentBoxSelector = 'div[data-testid="fb-comments-plugin"], [aria-label*="escribe un comentario"], [placeholder*="comentario"], [placeholder*="Comentario"]';
    
    try {
      await page.waitForSelector(commentBoxSelector, { timeout: 5000 }).catch(() => null);
    } catch (e) {
      // Try alternate selectors
      console.log(`[PLAYWRIGHT] Comment box not found, trying alternate selectors...`);
    }
    
    // Find and click on comment input
    const commentInputs = await page.locator('textarea, [contenteditable="true"]').filter({
      hasText: /comentario|comment|Escribe/i
    }).all();
    
    if (commentInputs.length === 0) {
      console.log(`[PLAYWRIGHT] No comment input found, trying generic approach...`);
      // Try to find any textarea or contenteditable
      const allInputs = await page.locator('textarea, [contenteditable="true"]').all();
      if (allInputs.length > 0) {
        await allInputs[0].click();
        await allInputs[0].fill(commentText);
      } else {
        throw new Error("No comment input found on the page");
      }
    } else {
      await commentInputs[0].click();
      await commentInputs[0].fill(commentText);
    }
    
    console.log(`[PLAYWRIGHT] Comment text entered: "${commentText}"`);
    
    // Try to find and click submit button
    const submitButtons = await page.locator('button').filter({
      hasText: /publicar|post|comentar|enviar|submit/i
    }).all();
    
    if (submitButtons.length > 0) {
      await submitButtons[0].click();
      console.log(`[PLAYWRIGHT] Submit button clicked`);
      
      // Wait for confirmation (wait for a short period to ensure submission)
      await page.waitForTimeout(2000);
    } else {
      // Try to press Enter to submit
      await page.keyboard.press("Enter");
      console.log(`[PLAYWRIGHT] Pressed Enter to submit`);
      await page.waitForTimeout(2000);
    }
    
    console.log(`[PLAYWRIGHT] Comment submission completed for: ${account.accountName}`);
    return true;
    
  } catch (error: any) {
    console.error(`[PLAYWRIGHT] Error for account ${account.accountName}:`, error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[PLAYWRIGHT] Browser closed`);
    }
  }
}

export async function executePostAutomation(request: AutomationRequest): Promise<AutomationResult[]> {
  const { postUrl, selectedAccounts, actionType, commentText } = request;
  const results: AutomationResult[] = [];

  console.log(`[AUTOMATION] Executing automation for post: ${postUrl}`);
  console.log(`[AUTOMATION] Accounts: ${selectedAccounts.length}, Action: ${actionType}`);

  for (const accountId of selectedAccounts) {
    try {
      const account = await storage.getFacebookAccount(accountId);
      if (!account) {
        results.push({
          accountId,
          accountName: "Unknown",
          success: false,
          message: "Cuenta no encontrada",
        });
        continue;
      }

      console.log(`[AUTOMATION] Processing account: ${account.accountName}`);

      if (actionType === "comment" && commentText) {
        try {
          const success = await commentOnPost(postUrl, commentText, account);
          if (success) {
            results.push({
              accountId,
              accountName: account.accountName,
              success: true,
              message: "Comentario publicado exitosamente",
            });
          }
        } catch (error: any) {
          results.push({
            accountId,
            accountName: account.accountName,
            success: false,
            message: `Error al comentar: ${error.message}`,
          });
        }
      } else {
        results.push({
          accountId,
          accountName: account.accountName,
          success: false,
          message: "Acción no soportada o faltan parámetros",
        });
      }
    } catch (error: any) {
      results.push({
        accountId,
        accountName: "Unknown",
        success: false,
        message: error.message || "Error desconocido",
      });
    }
  }

  console.log(`[AUTOMATION] Completed: ${results.filter(r => r.success).length}/${results.length} successful`);
  return results;
}
