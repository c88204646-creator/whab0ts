import { storage } from "./storage";
import type { FacebookAccount } from "@shared/schema";

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

async function simulateCommentOnPost(
  postUrl: string,
  commentText: string,
  account: FacebookAccount,
  commentType: string
): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate API call delay
    setTimeout(() => {
      console.log(`[AUTOMATION] Comentario publicado en: ${postUrl}`);
      console.log(`[AUTOMATION] Cuenta: ${account.accountName}`);
      console.log(`[AUTOMATION] Tipo: ${commentType}`);
      console.log(`[AUTOMATION] Texto: "${commentText}"`);
      resolve(true);
    }, 2000);
  });
}

export async function executePostAutomation(request: AutomationRequest): Promise<AutomationResult[]> {
  const { postUrl, selectedAccounts, actionType, commentText, commentType = "general" } = request;
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
          const success = await simulateCommentOnPost(postUrl, commentText, account, commentType);
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
