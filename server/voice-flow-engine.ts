import { storage } from "./storage";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import { 
  calendarAvailability, 
  calendarConfig, 
  calendarEvents,
  storeProducts,
  storeServices,
  stores,
  clients,
  leads
} from "@shared/schema";
import type { 
  AIVoiceAgent, 
  CompanyProfile, 
  AgentPersonality,
  CalendarPolicy,
  ToolPermissions 
} from "@shared/schema";

// Tipos de código de país para formateo de WhatsApp
interface CountryCode {
  code: string;
  name: string;
  localDigits: number;
}

const COUNTRY_CODES: Record<string, CountryCode> = {
  "mexico": { code: "52", name: "México", localDigits: 10 },
  "mx": { code: "52", name: "México", localDigits: 10 },
  "estados unidos": { code: "1", name: "Estados Unidos", localDigits: 10 },
  "usa": { code: "1", name: "Estados Unidos", localDigits: 10 },
  "eeuu": { code: "1", name: "Estados Unidos", localDigits: 10 },
  "españa": { code: "34", name: "España", localDigits: 9 },
  "spain": { code: "34", name: "España", localDigits: 9 },
  "colombia": { code: "57", name: "Colombia", localDigits: 10 },
  "argentina": { code: "54", name: "Argentina", localDigits: 10 },
  "chile": { code: "56", name: "Chile", localDigits: 9 },
  "peru": { code: "51", name: "Perú", localDigits: 9 },
  "perú": { code: "51", name: "Perú", localDigits: 9 },
  "venezuela": { code: "58", name: "Venezuela", localDigits: 10 },
  "ecuador": { code: "593", name: "Ecuador", localDigits: 9 },
  "guatemala": { code: "502", name: "Guatemala", localDigits: 8 },
  "cuba": { code: "53", name: "Cuba", localDigits: 8 },
  "republica dominicana": { code: "1", name: "República Dominicana", localDigits: 10 },
  "honduras": { code: "504", name: "Honduras", localDigits: 8 },
  "el salvador": { code: "503", name: "El Salvador", localDigits: 8 },
  "nicaragua": { code: "505", name: "Nicaragua", localDigits: 8 },
  "costa rica": { code: "506", name: "Costa Rica", localDigits: 8 },
  "panama": { code: "507", name: "Panamá", localDigits: 8 },
  "panamá": { code: "507", name: "Panamá", localDigits: 8 },
  "uruguay": { code: "598", name: "Uruguay", localDigits: 9 },
  "paraguay": { code: "595", name: "Paraguay", localDigits: 9 },
  "bolivia": { code: "591", name: "Bolivia", localDigits: 8 },
};

// Estado de la conversación
interface ConversationState {
  agentId: string;
  userId: string;
  callSid: string;
  agent: AIVoiceAgent | null;
  stage: ConversationStage;
  collectedData: CollectedData;
  history: ConversationTurn[];
  pendingAction: PendingAction | null;
  startTime: Date;
  lastActivity: Date;
  missedIntentCount: number;
}

type ConversationStage = 
  | "greeting"
  | "listening"
  | "collecting_name"
  | "collecting_phone"
  | "collecting_country"
  | "collecting_email"
  | "collecting_date"
  | "collecting_time"
  | "confirming_appointment"
  | "offering_support"
  | "farewell";

interface CollectedData {
  name?: string;
  phone?: string;
  countryCode?: string;
  email?: string;
  preferredDate?: string;
  preferredTime?: string;
  serviceInterest?: string;
  notes?: string;
}

interface ConversationTurn {
  role: "user" | "agent";
  message: string;
  timestamp: Date;
}

interface PendingAction {
  type: "book_appointment" | "create_lead" | "transfer_call";
  data: Record<string, any>;
}

// Almacén de conversaciones activas
const activeConversations = new Map<string, ConversationState>();

// Patrones de intención
const INTENT_PATTERNS: Record<string, RegExp[]> = {
  greeting: [
    /^(hola|buenos?\s*(días|tardes|noches)|hey|hi|hello|buenas)/i,
    /^(qué\s*tal|cómo\s*está)/i,
  ],
  appointment: [
    /(cita|agendar|reservar|programar|turno|disponibilidad|horarios?)/i,
    /(quiero\s*(una?\s*)?(cita|reserva|turno))/i,
    /(cuándo\s*(pueden|puedo)|hay\s*espacio)/i,
  ],
  products: [
    /(productos?|qué\s*venden|catálogo|precios?|cuánto\s*cuesta)/i,
    /(comprar|adquirir|ordenar)/i,
  ],
  services: [
    /(servicios?|qué\s*ofrecen|qué\s*hacen)/i,
    /(tratamientos?|consultas?)/i,
  ],
  hours: [
    /(horarios?\s*(de\s*atención)?|a\s*qué\s*hora\s*(abren|cierran))/i,
    /(cuándo\s*están\s*abiertos?)/i,
  ],
  location: [
    /(dónde\s*están|ubicación|dirección|cómo\s*llego)/i,
    /(en\s*qué\s*parte|dónde\s*queda)/i,
  ],
  human: [
    /(hablar\s*con\s*(una?\s*)?(persona|humano|agente|asesor))/i,
    /(quiero\s*hablar\s*con\s*alguien|representante)/i,
  ],
  yes: [
    /^(sí|si|yes|ok|okay|claro|correcto|exacto|así\s*es|afirmativo|dale|va|por\s*supuesto|está\s*bien|de\s*acuerdo|perfecto|listo)$/i,
  ],
  no: [
    /^(no|nope|negativo|para\s*nada|nel|no\s*gracias|mejor\s*no|todavía\s*no|aún\s*no)$/i,
  ],
  goodbye: [
    /(adiós|adios|hasta\s*luego|chao|bye|goodbye|nos\s*vemos|eso\s*es\s*todo|nada\s*más)/i,
  ],
  thanks: [
    /^(gracias|muchas\s*gracias|te\s*lo\s*agradezco|thanks|thank\s*you)/i,
  ],
  help: [
    /(ayuda|no\s*entiendo|puedes?\s*repetir|qué\s*puedo\s*hacer|opciones)/i,
  ],
};

// Extractores de datos
function extractName(text: string): string | null {
  const patterns = [
    /(?:me\s*llamo|mi\s*nombre\s*es|soy)\s+([A-Za-zÁáÉéÍíÓóÚúÑñ\s]{2,40})/i,
    /^([A-Za-zÁáÉéÍíÓóÚúÑñ]+(?:\s+[A-Za-zÁáÉéÍíÓóÚúÑñ]+){0,3})$/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractPhone(text: string): string | null {
  const cleaned = text.replace(/[^\d]/g, '');
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return cleaned;
  }
  return null;
}

function extractEmail(text: string): string | null {
  const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  return match ? match[1].toLowerCase() : null;
}

function extractCountry(text: string): CountryCode | null {
  const normalized = text.toLowerCase().trim();
  for (const [key, value] of Object.entries(COUNTRY_CODES)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return null;
}

function extractDate(text: string): string | null {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (/hoy/i.test(text)) {
    return today.toISOString().split('T')[0];
  }
  if (/mañana/i.test(text)) {
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Día de la semana
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'miercoles', 'jueves', 'viernes', 'sábado', 'sabado'];
  for (let i = 0; i < days.length; i++) {
    if (text.toLowerCase().includes(days[i])) {
      const targetDay = i > 6 ? i - 1 : i; // Normalizar miércoles/sábado
      const daysUntil = (targetDay - today.getDay() + 7) % 7 || 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntil);
      return targetDate.toISOString().split('T')[0];
    }
  }
  
  // Formato numérico
  const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1;
    const year = dateMatch[3] ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3])) : today.getFullYear();
    const date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  }
  
  return null;
}

function extractTime(text: string): string | null {
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|de\s*la\s*mañana|de\s*la\s*tarde|de\s*la\s*noche)?/i);
  if (match) {
    let hour = parseInt(match[1]);
    const minutes = match[2] || "00";
    const period = match[3]?.toLowerCase() || "";
    
    if (period.includes("pm") || period.includes("tarde") || period.includes("noche")) {
      if (hour < 12) hour += 12;
    } else if (period.includes("am") || period.includes("mañana")) {
      if (hour === 12) hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  }
  return null;
}

function detectIntent(text: string): string {
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return intent;
      }
    }
  }
  return "unknown";
}

// Funciones de base de datos
async function getAvailability(userId: string): Promise<{ day: number; start: string; end: string; active: boolean }[]> {
  try {
    const availability = await db.select()
      .from(calendarAvailability)
      .where(eq(calendarAvailability.userId, userId));
    
    return availability.map(a => ({
      day: a.dayOfWeek,
      start: a.startTime,
      end: a.endTime,
      active: a.isActive
    }));
  } catch (error) {
    console.error("Error getting availability:", error);
    return [];
  }
}

async function getCalendarConfigForUser(userId: string) {
  try {
    const config = await db.select()
      .from(calendarConfig)
      .where(eq(calendarConfig.userId, userId))
      .limit(1);
    return config[0] || null;
  } catch (error) {
    console.error("Error getting calendar config:", error);
    return null;
  }
}

async function getExistingEvents(userId: string, date: string): Promise<{ start: Date; end: Date }[]> {
  try {
    const startOfDay = new Date(date + 'T00:00:00');
    const endOfDay = new Date(date + 'T23:59:59');
    
    const events = await db.select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          gte(calendarEvents.startTime, startOfDay),
          lte(calendarEvents.startTime, endOfDay)
        )
      );
    
    return events.map(e => ({ start: e.startTime, end: e.endTime }));
  } catch (error) {
    console.error("Error getting events:", error);
    return [];
  }
}

async function getAvailableSlots(userId: string, date: string): Promise<string[]> {
  const availability = await getAvailability(userId);
  const config = await getCalendarConfigForUser(userId);
  const existingEvents = await getExistingEvents(userId, date);
  
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();
  
  const dayAvailability = availability.filter(a => a.day === dayOfWeek && a.active);
  if (dayAvailability.length === 0) return [];
  
  const duration = config?.eventDurationMinutes || 60;
  const slots: string[] = [];
  
  for (const avail of dayAvailability) {
    const [startHour, startMin] = avail.start.split(':').map(Number);
    const [endHour, endMin] = avail.end.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    while (currentMinutes + duration <= endMinutes) {
      const slotStart = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`;
      const slotEnd = new Date(targetDate);
      slotEnd.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);
      
      // Verificar si el slot está ocupado
      const isOccupied = existingEvents.some(event => {
        const eventStart = event.start.getHours() * 60 + event.start.getMinutes();
        const eventEnd = event.end.getHours() * 60 + event.end.getMinutes();
        return currentMinutes >= eventStart && currentMinutes < eventEnd;
      });
      
      if (!isOccupied) {
        slots.push(slotStart);
      }
      
      currentMinutes += duration;
    }
  }
  
  return slots;
}

async function createAppointment(
  userId: string, 
  data: CollectedData,
  agentName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getCalendarConfigForUser(userId);
    const duration = config?.eventDurationMinutes || 60;
    
    if (!data.preferredDate || !data.preferredTime) {
      return { success: false, message: "Falta la fecha u hora" };
    }
    
    const startTime = new Date(`${data.preferredDate}T${data.preferredTime}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    // Formatear teléfono con código de país
    let formattedPhone = data.phone || "";
    if (data.countryCode && data.phone) {
      formattedPhone = `+${data.countryCode}${data.phone}`;
    }
    
    await db.insert(calendarEvents).values({
      userId,
      title: `Cita agendada por ${agentName}`,
      description: data.notes || `Cliente: ${data.name}\nServicio de interés: ${data.serviceInterest || 'General'}`,
      startTime,
      endTime,
      contactName: data.name || "Cliente",
      contactPhone: formattedPhone,
      email: data.email || null,
      status: "pending",
      isPublicBooking: true,
      isActive: true,
    });
    
    return { success: true, message: "Cita agendada exitosamente" };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return { success: false, message: "Error al agendar la cita" };
  }
}

async function createLead(userId: string, data: CollectedData, source: string): Promise<boolean> {
  try {
    let formattedPhone = data.phone || "";
    if (data.countryCode && data.phone) {
      formattedPhone = `+${data.countryCode}${data.phone}`;
    }
    
    await db.insert(leads).values({
      userId,
      name: data.name || "Prospecto de llamada",
      phone: formattedPhone,
      email: data.email || null,
      source: `Llamada IA: ${source}`,
      status: "new",
      notes: data.notes || "",
    });
    
    return true;
  } catch (error) {
    console.error("Error creating lead:", error);
    return false;
  }
}

async function getProductsAndServices(agentId: string): Promise<{ products: any[]; services: any[] }> {
  try {
    const agent = await storage.getAIVoiceAgentById(agentId);
    if (!agent) return { products: [], services: [] };
    
    // Si hay tienda vinculada, obtener productos de ahí
    if (agent.linkedStoreId) {
      const products = await db.select()
        .from(storeProducts)
        .where(and(
          eq(storeProducts.storeId, agent.linkedStoreId),
          eq(storeProducts.isActive, true)
        ))
        .limit(10);
      
      const services = await db.select()
        .from(storeServices)
        .where(and(
          eq(storeServices.storeId, agent.linkedStoreId),
          eq(storeServices.isActive, true)
        ))
        .limit(10);
      
      return { products, services };
    }
    
    // Usar productos/servicios del agente si existen
    const agentProducts = (agent.products as any[]) || [];
    const agentServices = (agent.services as any[]) || [];
    
    return { products: agentProducts, services: agentServices };
  } catch (error) {
    console.error("Error getting products/services:", error);
    return { products: [], services: [] };
  }
}

// Función principal de inicialización
export async function initializeFlowConversation(
  agentId: string,
  callSid: string,
  callerPhone: string
): Promise<{ success: boolean; greeting: string }> {
  try {
    const agent = await storage.getAIVoiceAgent(agentId);
    
    if (!agent) {
      return {
        success: false,
        greeting: "Lo siento, no pude cargar la configuración del agente."
      };
    }
    
    const companyProfile = (agent.companyProfile as CompanyProfile) || { businessName: "" };
    const personality = (agent.personality as AgentPersonality) || { greeting: "", tone: "professional" };
    
    // Crear estado de conversación
    const state: ConversationState = {
      agentId,
      userId: agent.userId,
      callSid,
      agent,
      stage: "greeting",
      collectedData: {},
      history: [],
      pendingAction: null,
      startTime: new Date(),
      lastActivity: new Date(),
      missedIntentCount: 0,
    };
    
    activeConversations.set(callSid, state);
    
    // Construir saludo profesional con nombre de empresa y agente
    let greeting = "";
    // Soportar tanto businessName como name para compatibilidad
    const businessName = companyProfile.businessName || (companyProfile as any).name || "";
    const agentName = agent.name || "Asistente Virtual";
    
    // Saludo según hora del día
    const hour = new Date().getHours();
    let timeGreeting = "Buenos días";
    if (hour >= 12 && hour < 19) timeGreeting = "Buenas tardes";
    else if (hour >= 19 || hour < 6) timeGreeting = "Buenas noches";
    
    // SIEMPRE usar saludo profesional con empresa/agente primero
    if (businessName) {
      // Saludo profesional completo con empresa y agente
      greeting = `${timeGreeting}. Le habla ${agentName} de ${businessName}. Es un gusto atenderle. ¿En qué puedo ayudarle hoy?`;
    } else if (personality.greeting && personality.greeting.length > 10) {
      // Fallback a saludo personalizado del agente
      greeting = personality.greeting;
    } else {
      // Saludo profesional sin empresa
      greeting = `${timeGreeting}. Mi nombre es ${agentName}. ¿En qué puedo ayudarle?`;
    }
    
    console.log(`[FLOW] Saludo profesional: empresa="${businessName}", agente="${agentName}"`);
    
    state.history.push({ role: "agent", message: greeting, timestamp: new Date() });
    state.stage = "listening";
    
    return { success: true, greeting };
  } catch (error) {
    console.error("Error initializing conversation:", error);
    return {
      success: false,
      greeting: "Disculpe, hubo un problema al iniciar. Por favor intente nuevamente."
    };
  }
}

// Procesar entrada del usuario
export async function processFlowInput(
  agentId: string,
  userInput: string,
  callSid?: string
): Promise<{ response: string; shouldEnd: boolean; action?: string }> {
  // DEBUG: Ver todas las conversaciones activas
  console.log(`[FLOW-DEBUG] Buscando estado para callSid="${callSid}", agentId="${agentId}"`);
  console.log(`[FLOW-DEBUG] Conversaciones activas: ${Array.from(activeConversations.keys()).join(', ') || 'ninguna'}`);
  
  // Buscar conversación activa - preferir por callSid, luego por agentId
  let state: ConversationState | null = null;
  
  if (callSid && activeConversations.has(callSid)) {
    state = activeConversations.get(callSid)!;
    console.log(`[FLOW-DEBUG] ✅ Estado encontrado por callSid`);
  } else {
    // Fallback: buscar por agentId (para compatibilidad)
    for (const [sid, s] of activeConversations.entries()) {
      if (s.agentId === agentId) {
        state = s;
        console.log(`[FLOW-DEBUG] ✅ Estado encontrado por agentId (fallback), sid=${sid}`);
        break;
      }
    }
  }
  
  if (!state || !state.agent) {
    // Crear nueva conversación si no existe
    console.log(`[FLOW-DEBUG] ⚠️ No se encontró estado, creando nuevo...`);
    const newCallSid = callSid || `call-${Date.now()}`;
    const result = await initializeFlowConversation(agentId, newCallSid, "");
    return { response: result.greeting, shouldEnd: false };
  }
  
  state.lastActivity = new Date();
  state.history.push({ role: "user", message: userInput, timestamp: new Date() });
  
  const agent = state.agent;
  const companyProfile = (agent.companyProfile as CompanyProfile) || { businessName: "" };
  const personality = (agent.personality as AgentPersonality) || {};
  const toolPermissions = (agent.toolPermissions as ToolPermissions) || {};
  const calendarPolicy = (agent.calendarPolicy as CalendarPolicy) || {};
  
  const intent = detectIntent(userInput);
  let response = "";
  let shouldEnd = false;
  
  console.log(`[FLOW] Stage: ${state.stage}, Intent: ${intent}, Input: "${userInput}"`);
  
  // Manejar según el stage actual
  switch (state.stage) {
    case "listening":
      response = await handleListeningStage(state, intent, userInput, companyProfile, toolPermissions);
      break;
      
    case "collecting_name":
      const name = extractName(userInput);
      if (name) {
        state.collectedData.name = name;
        state.stage = "collecting_phone";
        response = `Perfecto ${name}. ¿Cuál es su teléfono?`;
      } else {
        response = "No capté su nombre. ¿Me lo repite?";
      }
      break;
      
    case "collecting_phone":
      const phone = extractPhone(userInput);
      if (phone) {
        state.collectedData.phone = phone;
        state.stage = "collecting_country";
        response = "Gracias. ¿De qué país es? México, Estados Unidos, etc.";
      } else {
        response = "No capté el número. ¿Me lo dicta de nuevo?";
      }
      break;
      
    case "collecting_country":
      const country = extractCountry(userInput);
      if (country) {
        state.collectedData.countryCode = country.code;
        
        if (state.pendingAction?.type === "book_appointment") {
          state.stage = "collecting_date";
          response = `Número de ${country.name}. ¿Para qué día quiere su cita?`;
        } else {
          state.stage = "collecting_email";
          response = `¿Tiene correo electrónico? Puede decir "saltar" si no.`;
        }
      } else {
        response = "¿De qué país es su número?";
      }
      break;
      
    case "collecting_email":
      if (intent === "no" || /no\s*tengo|saltar|prefiero\s*no/i.test(userInput)) {
        state.collectedData.email = undefined;
        response = await finalizeDataCollection(state, companyProfile);
        shouldEnd = true;
      } else {
        const email = extractEmail(userInput);
        if (email) {
          state.collectedData.email = email;
          response = await finalizeDataCollection(state, companyProfile);
          shouldEnd = true;
        } else {
          response = "No capté el correo. ¿Lo deletrea o prefiere saltar?";
        }
      }
      break;
      
    case "collecting_date":
      const date = extractDate(userInput);
      if (date) {
        state.collectedData.preferredDate = date;
        
        const slots = await getAvailableSlots(state.userId, date);
        if (slots.length === 0) {
          response = `No hay horarios ese día. ¿Otra fecha?`;
        } else {
          state.stage = "collecting_time";
          const slotsPreview = slots.slice(0, 3).map(s => {
            const [h, m] = s.split(':');
            const hour = parseInt(h);
            return `${hour > 12 ? hour - 12 : hour}${m !== '00' ? ':'+m : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
          }).join(', ');
          response = `Hay espacio: ${slotsPreview}. ¿A qué hora?`;
        }
      } else {
        response = "¿Qué día? Hoy, mañana, o día específico.";
      }
      break;
      
    case "collecting_time":
      const time = extractTime(userInput);
      if (time) {
        state.collectedData.preferredTime = time;
        state.stage = "confirming_appointment";
        
        const dateFormatted = formatDate(state.collectedData.preferredDate!);
        const timeFormatted = formatTime(time);
        
        response = `Cita el ${dateFormatted} a las ${timeFormatted}. ¿Confirma?`;
      } else {
        response = "¿A qué hora? Ejemplo: 10 AM, 3 de la tarde.";
      }
      break;
      
    case "confirming_appointment":
      if (intent === "yes") {
        const result = await createAppointment(state.userId, state.collectedData, agent.name);
        if (result.success) {
          response = `¡Cita agendada! Le enviaremos recordatorio. ¡Buen día!`;
          shouldEnd = true;
        } else {
          response = "Problema al agendar. ¿Quiere que un agente le contacte?";
          state.stage = "offering_support";
        }
      } else if (intent === "no") {
        state.stage = "collecting_date";
        response = "Entendido. ¿Para qué otra fecha le gustaría agendar?";
      } else {
        response = "¿Confirma la cita? Por favor responda sí o no.";
      }
      break;
      
    case "offering_support":
      if (intent === "yes") {
        await createLead(state.userId, state.collectedData, agent.name);
        response = `Un agente le contactará pronto. ¡Buen día!`;
        shouldEnd = true;
      } else {
        state.stage = "listening";
        response = "¿Algo más?";
      }
      break;
      
    case "farewell":
      shouldEnd = true;
      response = "Gracias. ¡Buen día!";
      break;
      
    default:
      response = await handleListeningStage(state, intent, userInput, companyProfile, toolPermissions);
  }
  
  state.history.push({ role: "agent", message: response, timestamp: new Date() });
  
  return { response, shouldEnd };
}

async function handleListeningStage(
  state: ConversationState,
  intent: string,
  userInput: string,
  companyProfile: CompanyProfile,
  toolPermissions: ToolPermissions
): Promise<string> {
  const agent = state.agent!;
  
  switch (intent) {
    case "greeting":
      return "¡Hola! ¿En qué le ayudo?";
      
    case "appointment":
      if (toolPermissions.canBookAppointments) {
        state.pendingAction = { type: "book_appointment", data: {} };
        state.stage = "collecting_name";
        return "Claro, le agendo. ¿Cuál es su nombre?";
      }
      return "No tenemos agenda por teléfono. ¿Algo más?";
      
    case "products":
      const { products } = await getProductsAndServices(state.agentId);
      if (products.length > 0) {
        const productList = products.slice(0, 2).map(p => 
          `${p.name} $${(p.price / 100).toFixed(0)}`
        ).join(', ');
        return `Productos: ${productList}. ¿Le interesa alguno?`;
      }
      return "No tenemos productos en sistema. ¿Algo más?";
      
    case "services":
      const { services } = await getProductsAndServices(state.agentId);
      if (services.length > 0) {
        const serviceList = services.slice(0, 2).map(s => s.name).join(', ');
        return `Servicios: ${serviceList}. ¿Desea agendar?`;
      }
      
      const faqs = (agent.faqs as any[]) || [];
      const serviceFaq = faqs.find(f => /servicios?/i.test(f.question));
      if (serviceFaq) {
        return serviceFaq.answer.substring(0, 100);
      }
      return `Ofrecemos varios servicios. ¿Algo específico?`;
      
    case "hours":
      if (companyProfile.workingHours) {
        return `Horario: ${companyProfile.workingHours}. ¿Algo más?`;
      }
      return "Consulte horarios en WhatsApp. ¿Algo más?";
      
    case "location":
      if (companyProfile.addresses && companyProfile.addresses.length > 0) {
        return `Ubicación: ${companyProfile.addresses[0].substring(0, 60)}`;
      }
      return "Ubicación en nuestro sitio web. ¿Algo más?";
      
    case "human":
      state.stage = "offering_support";
      state.pendingAction = { type: "transfer_call", data: {} };
      if (!state.collectedData.name) {
        state.stage = "collecting_name";
        return "Le conecto con un agente. ¿Su nombre?";
      }
      await createLead(state.userId, state.collectedData, agent.name);
      return "Registrado. Un agente le contactará. ¿Algo más?";
      
    case "goodbye":
    case "thanks":
      state.stage = "farewell";
      return `De nada. ¡Buen día!`;
      
    case "help":
      return "Puedo: agendar citas, info de servicios, horarios. ¿Qué prefiere?";
      
    case "unknown":
    default:
      state.missedIntentCount++;
      
      if (state.missedIntentCount >= 3) {
        state.stage = "offering_support";
        return "No entiendo bien. ¿Prefiere hablar con un agente?";
      }
      
      const agentFaqs = (agent.faqs as any[]) || [];
      for (const faq of agentFaqs) {
        const keywords = faq.question.toLowerCase().split(' ').filter((w: string) => w.length > 3);
        const matches = keywords.filter((kw: string) => userInput.toLowerCase().includes(kw));
        if (matches.length >= 2) {
          return faq.answer.substring(0, 120);
        }
      }
      
      return "No entendí. ¿Cita, servicios, o hablar con agente?";
  }
}

async function finalizeDataCollection(
  state: ConversationState,
  companyProfile: CompanyProfile
): Promise<string> {
  await createLead(state.userId, state.collectedData, state.agent?.name || "Asistente IA");
  return `Registrado. Le contactaremos pronto. ¡Buen día!`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  return date.toLocaleDateString('es-MX', options);
}

function formatTime(timeStr: string): string {
  const [hour, min] = timeStr.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${hour12}:${min.toString().padStart(2, '0')} ${period}`;
}

// Funciones de utilidad existentes
export function endFlowConversation(callSid: string): void {
  activeConversations.delete(callSid);
}

export function getActiveConversation(callSid: string): ConversationState | undefined {
  return activeConversations.get(callSid);
}

export function getStreamStats() {
  return {
    activeConversations: activeConversations.size,
    conversations: Array.from(activeConversations.entries()).map(([id, state]) => ({
      id,
      agentId: state.agentId,
      stage: state.stage,
      startTime: state.startTime,
      historyLength: state.history.length,
    })),
  };
}
