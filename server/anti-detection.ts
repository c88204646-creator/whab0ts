// Anti-detection measures to prevent WhatsApp account blocking

// Add random delay to simulate human behavior
export async function addRandomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
}

// Calculate typing time based on message length (simulate human typing speed)
export function calculateTypingTime(messageLength: number): number {
  // Average human typing speed: 40 WPM = ~200 characters per minute = ~3.3 chars per second
  // With some variation and thinking time
  const baseTypingTime = (messageLength / 3.3) * 1000; // ms
  const minThinkingTime = 1000; // 1 second minimum thinking time
  const totalTime = baseTypingTime + minThinkingTime;
  
  // Add randomness (±30%)
  const variation = totalTime * 0.3;
  const randomizedTime = totalTime + (Math.random() - 0.5) * variation * 2;
  
  return Math.max(minThinkingTime, Math.round(randomizedTime));
}

// Track daily message count per contact to prevent rate limiting
export class DailyMessageTracker {
  private messageCount: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor() {
    // Reset daily counts every 24 hours
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.messageCount.entries()) {
        if (now - data.resetTime > 24 * 60 * 60 * 1000) {
          this.messageCount.delete(key);
        }
      }
    }, 60 * 60 * 1000); // Check every hour
  }
  
  getKey(accountId: string, contactNumber: string): string {
    return `${accountId}:${contactNumber}`;
  }
  
  increment(accountId: string, contactNumber: string): void {
    const key = this.getKey(accountId, contactNumber);
    const data = this.messageCount.get(key) || { count: 0, resetTime: Date.now() };
    data.count++;
    this.messageCount.set(key, data);
  }
  
  getCount(accountId: string, contactNumber: string): number {
    const key = this.getKey(accountId, contactNumber);
    return this.messageCount.get(key)?.count || 0;
  }
  
  canSend(accountId: string, contactNumber: string, limit: number): boolean {
    if (limit === 0) return true; // 0 means unlimited
    return this.getCount(accountId, contactNumber) < limit;
  }
}

export const dailyMessageTracker = new DailyMessageTracker();

// Best practices for avoiding WhatsApp detection
export const ANTI_DETECTION_TIPS = {
  description: "Medidas para evitar que WhatsApp detecte automatización",
  tips: [
    "✓ Usa delays aleatorios entre mensajes (2-8 segundos por defecto)",
    "✓ Simula tiempo de escritura basado en la longitud del mensaje",
    "✓ Respeta límites de mensajes diarios por contacto",
    "✓ Mantén conversaciones naturales, no repitas patrones",
    "✓ Evita enviar a demasiados contactos en corto tiempo",
    "✓ No uses palabras clave que WhatsApp detecta como spam",
    "✓ Pausa la conexión cuando no la uses (para respetar sesión)",
    "✓ Monitorea el estado de la cuenta para detectar advertencias temprano",
  ]
};
