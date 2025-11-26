import { storage } from "./storage";

interface UsageRecord {
  characters: number;
  calls: number;
  lastReset: Date;
  monthlyChars: number;
  monthReset: Date;
}

interface BudgetConfig {
  dailyCharLimit: number;
  monthlyCharLimit: number;
  maxCharsPerResponse: number;
  usePollyForFallbacks: boolean;
  useTurboModel: boolean;
}

const DEFAULT_BUDGET: BudgetConfig = {
  dailyCharLimit: 50000,
  monthlyCharLimit: 500000,
  maxCharsPerResponse: 150,
  usePollyForFallbacks: true,
  useTurboModel: true,
};

const usageByUser = new Map<string, UsageRecord>();
const usageByAgent = new Map<string, UsageRecord>();
const inflightRequests = new Map<string, Promise<string | null>>();

function getOrCreateUsage(map: Map<string, UsageRecord>, key: string): UsageRecord {
  const now = new Date();
  
  if (!map.has(key)) {
    map.set(key, { 
      characters: 0, 
      calls: 0, 
      lastReset: now,
      monthlyChars: 0,
      monthReset: now,
    });
  }
  const usage = map.get(key)!;
  
  const daysDiff = (now.getTime() - usage.lastReset.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff >= 1) {
    usage.characters = 0;
    usage.calls = 0;
    usage.lastReset = now;
  }
  
  const monthsDiff = (now.getMonth() - usage.monthReset.getMonth()) + 
    (12 * (now.getFullYear() - usage.monthReset.getFullYear()));
  if (monthsDiff >= 1) {
    usage.monthlyChars = 0;
    usage.monthReset = now;
  }
  
  return usage;
}

export function trackTTSUsage(userId: string, agentId: string, characters: number): void {
  const userUsage = getOrCreateUsage(usageByUser, userId);
  const agentUsage = getOrCreateUsage(usageByAgent, agentId);
  
  userUsage.characters += characters;
  userUsage.monthlyChars += characters;
  userUsage.calls += 1;
  agentUsage.characters += characters;
  agentUsage.monthlyChars += characters;
  agentUsage.calls += 1;
  
  console.log(`📊 TTS - User: ${userUsage.characters}/${userUsage.monthlyChars} chars (día/mes)`);
}

export function checkBudget(userId: string, textLength: number, config: BudgetConfig = DEFAULT_BUDGET): {
  allowed: boolean;
  usePolly: boolean;
  reason?: string;
} {
  const userUsage = getOrCreateUsage(usageByUser, userId);
  
  if (userUsage.monthlyChars + textLength > config.monthlyCharLimit) {
    console.log(`⚠️ Budget: Límite mensual alcanzado para ${userId.substring(0,8)}`);
    return {
      allowed: config.usePollyForFallbacks,
      usePolly: true,
      reason: `Límite mensual alcanzado (${config.monthlyCharLimit} chars)`
    };
  }
  
  if (userUsage.characters + textLength > config.dailyCharLimit) {
    console.log(`⚠️ Budget: Límite diario alcanzado para ${userId.substring(0,8)}`);
    return {
      allowed: config.usePollyForFallbacks,
      usePolly: true,
      reason: `Límite diario alcanzado (${config.dailyCharLimit} chars)`
    };
  }
  
  if (textLength > config.maxCharsPerResponse) {
    return {
      allowed: true,
      usePolly: false,
      reason: `Respuesta truncada a ${config.maxCharsPerResponse} chars`
    };
  }
  
  return { allowed: true, usePolly: false };
}

export function truncateResponse(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclaim = truncated.lastIndexOf('!');
  
  const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclaim);
  
  if (lastSentence > maxLength * 0.5) {
    return truncated.substring(0, lastSentence + 1);
  }
  
  return truncated + "...";
}

export function getInflightRequest(key: string): Promise<string | null> | undefined {
  return inflightRequests.get(key);
}

export function setInflightRequest(key: string, promise: Promise<string | null>): void {
  inflightRequests.set(key, promise);
  promise.finally(() => {
    inflightRequests.delete(key);
  });
}

export function getUsageStats(userId?: string): {
  totalUsers: number;
  totalAgents: number;
  userUsage?: UsageRecord;
  topUsers: Array<{ id: string; chars: number }>;
} {
  const topUsers = Array.from(usageByUser.entries())
    .map(([id, usage]) => ({ id, chars: usage.characters }))
    .sort((a, b) => b.chars - a.chars)
    .slice(0, 10);
  
  return {
    totalUsers: usageByUser.size,
    totalAgents: usageByAgent.size,
    userUsage: userId ? usageByUser.get(userId) : undefined,
    topUsers,
  };
}

const PHRASE_ATOMS: Record<string, string> = {
  "0": "cero", "1": "uno", "2": "dos", "3": "tres", "4": "cuatro",
  "5": "cinco", "6": "seis", "7": "siete", "8": "ocho", "9": "nueve",
  "10": "diez", "11": "once", "12": "doce", "13": "trece", "14": "catorce",
  "15": "quince", "16": "dieciséis", "17": "diecisiete", "18": "dieciocho",
  "19": "diecinueve", "20": "veinte", "21": "veintiuno", "22": "veintidós",
  "23": "veintitrés", "24": "veinticuatro", "25": "veinticinco",
  "26": "veintiséis", "27": "veintisiete", "28": "veintiocho",
  "29": "veintinueve", "30": "treinta", "31": "treinta y uno",
  
  "lunes": "lunes", "martes": "martes", "miércoles": "miércoles",
  "jueves": "jueves", "viernes": "viernes", "sábado": "sábado", "domingo": "domingo",
  
  "enero": "enero", "febrero": "febrero", "marzo": "marzo", "abril": "abril",
  "mayo": "mayo", "junio": "junio", "julio": "julio", "agosto": "agosto",
  "septiembre": "septiembre", "octubre": "octubre", "noviembre": "noviembre",
  "diciembre": "diciembre",
  
  "am": "de la mañana", "pm_tarde": "de la tarde", "pm_noche": "de la noche",
  "a_las": "a las", "del": "del", "de": "de", "el": "el",
};

const CANONICAL_PHRASES: Record<string, string> = {
  "greeting_short": "¡Hola! ¿En qué puedo ayudarle?",
  "ask_name": "¿Me puede dar su nombre?",
  "ask_phone": "¿Cuál es su teléfono?",
  "ask_country": "¿De qué país nos llama?",
  "ask_email": "¿Tiene correo electrónico?",
  "ask_date": "¿Para qué fecha?",
  "ask_time": "¿A qué hora le conviene?",
  "confirm_yes": "Perfecto, confirmado.",
  "confirm_no": "Entendido, cancelado.",
  "thanks": "Gracias por llamar.",
  "goodbye": "¡Hasta luego!",
  "repeat": "¿Puede repetir?",
  "not_understood": "No entendí bien.",
  "one_moment": "Un momento.",
  "anything_else": "¿Algo más?",
  "help_offer": "¿En qué le ayudo?",
  "agent_contact": "Un agente le contactará.",
  "appointment_booked": "Cita agendada.",
  "no_availability": "No hay disponibilidad.",
  "send_details": "Le envío los detalles por WhatsApp.",
};

export function getCanonicalPhrase(key: string): string | undefined {
  return CANONICAL_PHRASES[key];
}

export function getAllCanonicalPhrases(): string[] {
  return Object.values(CANONICAL_PHRASES);
}

export function shortenResponse(text: string): string {
  const replacements: [RegExp, string][] = [
    [/Con mucho gusto le ayudo/gi, "Claro"],
    [/Permítame un momento/gi, "Un momento"],
    [/¿Me podría proporcionar/gi, "¿Cuál es"],
    [/¿Podría proporcionarme/gi, "¿Cuál es"],
    [/Le confirmo que/gi, ""],
    [/En este momento/gi, "Ahora"],
    [/Por favor,?\s*/gi, ""],
    [/perfectamente/gi, ""],
    [/exitosamente/gi, ""],
    [/a la brevedad posible/gi, "pronto"],
    [/Muchas gracias por su/gi, "Gracias por su"],
    [/¿Hay algo más en que pueda ayudarle\?/gi, "¿Algo más?"],
    [/¿Le puedo ayudar con algo más\?/gi, "¿Algo más?"],
    [/Que tenga un excelente día/gi, "¡Buen día!"],
    [/con gusto le/gi, "le"],
    [/estaré encantado de/gi, "puedo"],
  ];
  
  let shortened = text;
  for (const [pattern, replacement] of replacements) {
    shortened = shortened.replace(pattern, replacement);
  }
  
  shortened = shortened.replace(/\s+/g, ' ').trim();
  
  return shortened;
}

export function shouldUsePolly(text: string, isOperational: boolean = false): boolean {
  if (isOperational) return true;
  
  const operationalPatterns = [
    /no escuché/i,
    /no entendí/i,
    /podría repetir/i,
    /un momento/i,
    /sigue ahí/i,
    /no detecté/i,
  ];
  
  return operationalPatterns.some(p => p.test(text));
}

export const TTSConfig = {
  DEFAULT_BUDGET,
  PHRASE_ATOMS,
  CANONICAL_PHRASES,
};
