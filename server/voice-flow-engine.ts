import { storage } from "./storage";
import type { AIVoiceAgent } from "@shared/schema";

interface SlotValue {
  name: string;
  value: string;
  confirmed: boolean;
}

interface ConversationState {
  agentId: string;
  userId: string;
  callSid: string;
  callerPhone: string;
  currentFlowId: string;
  currentNodeId: string;
  slots: Record<string, SlotValue>;
  history: string[];
  startTime: Date;
  lastActivity: Date;
}

interface FlowNode {
  id: string;
  type: "greeting" | "question" | "confirm" | "action" | "response" | "transfer" | "end";
  message: string;
  slots?: string[];
  nextOnMatch?: Record<string, string>;
  defaultNext?: string;
  action?: string;
  actionParams?: Record<string, string>;
}

interface ConversationFlow {
  id: string;
  name: string;
  description: string;
  startNode: string;
  nodes: Record<string, FlowNode>;
}

const INTENT_PATTERNS: Record<string, RegExp[]> = {
  greeting: [
    /^(hola|buenos?\s*(días|tardes|noches)|hey|hi|hello)/i,
    /^(qué\s*tal|cómo\s*está)/i,
  ],
  appointment_check: [
    /(disponibilidad|horarios?\s*disponibles?|cuándo\s*puedo|tienen\s*espacio)/i,
    /(hay\s*citas?|puedo\s*agendar|quiero\s*una?\s*cita)/i,
    /(appointment|schedule|book|available)/i,
  ],
  appointment_book: [
    /(agendar|reservar|programar|hacer\s*una?\s*cita)/i,
    /(quiero\s*(una?\s*)?(cita|reserva|turno))/i,
    /(book|make.*appointment|schedule)/i,
  ],
  appointment_cancel: [
    /(cancelar|anular)\s*(mi)?\s*(cita|reserva|turno)/i,
    /(no\s*puedo\s*ir|ya\s*no\s*quiero)/i,
    /(cancel.*appointment)/i,
  ],
  appointment_reschedule: [
    /(cambiar|mover|reagendar)\s*(mi)?\s*(cita|reserva|turno)/i,
    /(otra\s*fecha|otro\s*horario)/i,
    /(reschedule|change.*appointment)/i,
  ],
  price_inquiry: [
    /(cuánto\s*cuesta|precio|costo|tarifa|cuánto\s*cobran)/i,
    /(qué\s*precio|cuál\s*es\s*el\s*precio)/i,
    /(how\s*much|price|cost)/i,
  ],
  service_inquiry: [
    /(qué\s*servicios?|qué\s*ofrecen|qué\s*hacen)/i,
    /(servicios?\s*disponibles?|qué\s*tienen)/i,
    /(what.*services?|what.*do.*you.*offer)/i,
  ],
  product_inquiry: [
    /(qué\s*productos?|qué\s*venden|catálogo)/i,
    /(productos?\s*disponibles?)/i,
    /(what.*products?|catalog)/i,
  ],
  hours_inquiry: [
    /(horarios?\s*de\s*atención|a\s*qué\s*hora\s*abren)/i,
    /(cuándo\s*están\s*abiertos?|horarios?)/i,
    /(business\s*hours|when.*open)/i,
  ],
  location_inquiry: [
    /(dónde\s*están|ubicación|dirección|cómo\s*llego)/i,
    /(en\s*qué\s*parte|dónde\s*queda)/i,
    /(where.*located|address|location)/i,
  ],
  human_transfer: [
    /(hablar\s*con\s*(una?\s*)?(persona|humano|agente|asesor))/i,
    /(quiero\s*hablar\s*con\s*alguien)/i,
    /(transfer|speak.*human|real\s*person)/i,
  ],
  confirmation_yes: [
    /^(sí|si|yes|ok|okay|claro|correcto|exacto|así\s*es|afirmativo|dale|va|por\s*supuesto)/i,
    /^(está\s*bien|de\s*acuerdo|perfecto|listo)/i,
  ],
  confirmation_no: [
    /^(no|nope|negativo|para\s*nada|nel)/i,
    /^(no\s*gracias|mejor\s*no)/i,
  ],
  goodbye: [
    /(adiós|adios|hasta\s*luego|chao|bye|goodbye|nos\s*vemos)/i,
    /(gracias.*eso\s*es\s*todo|eso\s*sería\s*todo)/i,
  ],
  thanks: [
    /^(gracias|muchas\s*gracias|te\s*lo\s*agradezco)/i,
    /^(thanks|thank\s*you)/i,
  ],
  help: [
    /(ayuda|no\s*entiendo|puedes?\s*repetir|qué\s*puedo\s*hacer)/i,
    /(help|what\s*can\s*you\s*do)/i,
  ],
};

const SLOT_EXTRACTORS: Record<string, { pattern: RegExp; extract: (match: RegExpMatchArray) => string }[]> = {
  date: [
    { 
      pattern: /(?:el\s+)?(\d{1,2})\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
      extract: (m) => `${m[1]} de ${m[2]}`
    },
    {
      pattern: /(hoy|mañana|pasado\s*mañana)/i,
      extract: (m) => m[1].toLowerCase()
    },
    {
      pattern: /(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i,
      extract: (m) => m[1].toLowerCase()
    },
    {
      pattern: /(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/,
      extract: (m) => `${m[1]}/${m[2]}${m[3] ? '/' + m[3] : ''}`
    },
  ],
  time: [
    {
      pattern: /(?:a\s*las?\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|de\s*la\s*mañana|de\s*la\s*tarde|de\s*la\s*noche)?/i,
      extract: (m) => {
        let hour = parseInt(m[1]);
        const minutes = m[2] || "00";
        const period = m[3]?.toLowerCase() || "";
        if (period.includes("pm") || period.includes("tarde") || period.includes("noche")) {
          if (hour < 12) hour += 12;
        }
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
      }
    },
  ],
  phone: [
    {
      pattern: /(\+?\d{1,3})?[\s\-]?\(?(\d{2,3})\)?[\s\-]?(\d{3,4})[\s\-]?(\d{4})/,
      extract: (m) => `${m[1] || ''}${m[2]}${m[3]}${m[4]}`.replace(/\D/g, '')
    },
  ],
  email: [
    {
      pattern: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
      extract: (m) => m[1].toLowerCase()
    },
  ],
  name: [
    {
      pattern: /(?:me\s*llamo|mi\s*nombre\s*es|soy)\s+([A-Za-zÁáÉéÍíÓóÚúÑñ\s]{2,40})/i,
      extract: (m) => m[1].trim()
    },
  ],
  service: [
    {
      pattern: /(consulta|cita|revisión|limpieza|tratamiento|servicio\s+\w+)/i,
      extract: (m) => m[1].toLowerCase()
    },
  ],
};

const activeConversations = new Map<string, ConversationState>();

const CACHED_RESPONSES: Map<string, string> = new Map();

export function detectIntent(text: string): { intent: string; confidence: number } {
  const normalizedText = text.toLowerCase().trim();
  
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        return { intent, confidence: 0.9 };
      }
    }
  }
  
  return { intent: "unknown", confidence: 0 };
}

export function extractSlots(text: string, slotTypes: string[]): Record<string, string> {
  const extracted: Record<string, string> = {};
  
  for (const slotType of slotTypes) {
    const extractors = SLOT_EXTRACTORS[slotType];
    if (!extractors) continue;
    
    for (const { pattern, extract } of extractors) {
      const match = text.match(pattern);
      if (match) {
        extracted[slotType] = extract(match);
        break;
      }
    }
  }
  
  return extracted;
}

function createDefaultFlow(agent: AIVoiceAgent): ConversationFlow {
  const personality = agent.personality as any;
  const companyProfile = agent.companyProfile as any;
  const services = agent.services as any[] || [];
  const products = agent.products as any[] || [];
  const toolPermissions = agent.toolPermissions as any;
  
  const greeting = personality?.greeting || `Hola, gracias por llamar${companyProfile?.name ? ' a ' + companyProfile.name : ''}. ¿En qué puedo ayudarle?`;
  
  let servicesText = "";
  if (services.length > 0) {
    servicesText = "Ofrecemos los siguientes servicios: " + 
      services.map(s => `${s.name} por $${s.price}`).join(", ") + ". ";
  }
  
  let productsText = "";
  if (products.length > 0) {
    productsText = "Tenemos disponibles: " + 
      products.map(p => `${p.name} por $${p.price}`).join(", ") + ". ";
  }
  
  const nodes: Record<string, FlowNode> = {
    start: {
      id: "start",
      type: "greeting",
      message: greeting,
      defaultNext: "wait_input"
    },
    wait_input: {
      id: "wait_input",
      type: "question",
      message: "",
      nextOnMatch: {
        appointment_check: "check_availability",
        appointment_book: "collect_appointment_info",
        price_inquiry: "show_prices",
        service_inquiry: "show_services",
        product_inquiry: "show_products",
        hours_inquiry: "show_hours",
        location_inquiry: "show_location",
        human_transfer: "transfer_human",
        goodbye: "goodbye",
        thanks: "thanks_response",
        help: "show_help",
      },
      defaultNext: "fallback_response"
    },
    check_availability: {
      id: "check_availability",
      type: "action",
      action: "check_calendar",
      message: "Déjeme revisar los horarios disponibles...",
      defaultNext: "show_availability"
    },
    show_availability: {
      id: "show_availability",
      type: "response",
      message: "Tenemos disponibilidad {availability}. ¿Le gustaría agendar una cita?",
      nextOnMatch: {
        confirmation_yes: "collect_appointment_info",
        confirmation_no: "anything_else"
      },
      defaultNext: "wait_input"
    },
    collect_appointment_info: {
      id: "collect_appointment_info",
      type: "question",
      message: "Perfecto. ¿Para qué fecha y hora le gustaría su cita?",
      slots: ["date", "time"],
      defaultNext: "confirm_appointment"
    },
    confirm_appointment: {
      id: "confirm_appointment",
      type: "confirm",
      message: "Entendido, sería el {date} a las {time}. ¿Es correcto?",
      nextOnMatch: {
        confirmation_yes: "create_appointment",
        confirmation_no: "collect_appointment_info"
      },
      defaultNext: "collect_appointment_info"
    },
    create_appointment: {
      id: "create_appointment",
      type: "action",
      action: "book_appointment",
      message: "Listo, su cita ha sido agendada para el {date} a las {time}. Le enviaremos un recordatorio.",
      defaultNext: "anything_else"
    },
    show_prices: {
      id: "show_prices",
      type: "response",
      message: servicesText + productsText + "¿Le gustaría más información sobre alguno?",
      defaultNext: "wait_input"
    },
    show_services: {
      id: "show_services",
      type: "response",
      message: servicesText || "Ofrecemos diversos servicios. ¿Hay algo específico que le interese?",
      defaultNext: "wait_input"
    },
    show_products: {
      id: "show_products",
      type: "response",
      message: productsText || "Tenemos varios productos disponibles. ¿Qué tipo de producto busca?",
      defaultNext: "wait_input"
    },
    show_hours: {
      id: "show_hours",
      type: "response",
      message: companyProfile?.businessHours || "Nuestro horario es de lunes a viernes de 9 a 6, y sábados de 9 a 2.",
      defaultNext: "wait_input"
    },
    show_location: {
      id: "show_location",
      type: "response",
      message: companyProfile?.address || "Puede encontrar nuestra ubicación en nuestra página web o redes sociales.",
      defaultNext: "wait_input"
    },
    show_help: {
      id: "show_help",
      type: "response",
      message: "Puedo ayudarle a agendar citas, consultar precios, servicios y horarios. ¿Qué necesita?",
      defaultNext: "wait_input"
    },
    transfer_human: {
      id: "transfer_human",
      type: "transfer",
      message: "Entendido, lo transfiero con uno de nuestros asesores. Un momento por favor.",
      defaultNext: "end"
    },
    fallback_response: {
      id: "fallback_response",
      type: "response",
      message: "Disculpe, no entendí bien. ¿Podría repetirlo de otra forma? Puedo ayudarle con citas, precios o información de servicios.",
      defaultNext: "wait_input"
    },
    anything_else: {
      id: "anything_else",
      type: "question",
      message: "¿Hay algo más en lo que pueda ayudarle?",
      nextOnMatch: {
        confirmation_yes: "wait_input",
        confirmation_no: "goodbye",
        goodbye: "goodbye"
      },
      defaultNext: "wait_input"
    },
    thanks_response: {
      id: "thanks_response",
      type: "response",
      message: "¡Con gusto! ¿Hay algo más en lo que pueda ayudarle?",
      nextOnMatch: {
        confirmation_no: "goodbye",
        goodbye: "goodbye"
      },
      defaultNext: "wait_input"
    },
    goodbye: {
      id: "goodbye",
      type: "end",
      message: personality?.farewell || "Gracias por su llamada. ¡Que tenga un excelente día!",
    },
    end: {
      id: "end",
      type: "end",
      message: ""
    }
  };
  
  return {
    id: "default",
    name: "Flujo Principal",
    description: "Flujo conversacional predeterminado",
    startNode: "start",
    nodes
  };
}

export async function initializeFlowConversation(
  agentId: string,
  callSid: string,
  callerPhone: string
): Promise<{ success: boolean; greeting: string; error?: string }> {
  try {
    const agent = await storage.getAIVoiceAgent(agentId);
    if (!agent) {
      return { success: false, greeting: "", error: "Agente no encontrado" };
    }
    
    const flow = createDefaultFlow(agent);
    const startNode = flow.nodes[flow.startNode];
    
    const state: ConversationState = {
      agentId,
      userId: agent.userId,
      callSid,
      callerPhone,
      currentFlowId: flow.id,
      currentNodeId: flow.startNode,
      slots: {},
      history: [],
      startTime: new Date(),
      lastActivity: new Date()
    };
    
    activeConversations.set(callSid, state);
    
    return { success: true, greeting: startNode.message };
  } catch (error: any) {
    console.error("Error initializing flow conversation:", error);
    return { success: false, greeting: "", error: error.message };
  }
}

export async function processFlowInput(
  callSid: string,
  userInput: string
): Promise<{ response: string; shouldEnd: boolean; action?: string }> {
  const state = activeConversations.get(callSid);
  if (!state) {
    return { 
      response: "Lo siento, ha ocurrido un error. Por favor llame de nuevo.", 
      shouldEnd: true 
    };
  }
  
  try {
    const agent = await storage.getAIVoiceAgent(state.agentId);
    if (!agent) {
      return { response: "Error del sistema.", shouldEnd: true };
    }
    
    const flow = createDefaultFlow(agent);
    const currentNode = flow.nodes[state.currentNodeId];
    
    state.history.push(`Usuario: ${userInput}`);
    state.lastActivity = new Date();
    
    if (currentNode.slots) {
      const extractedSlots = extractSlots(userInput, currentNode.slots);
      for (const [key, value] of Object.entries(extractedSlots)) {
        state.slots[key] = { name: key, value, confirmed: false };
      }
    }
    
    const { intent } = detectIntent(userInput);
    
    let nextNodeId = currentNode.defaultNext || "wait_input";
    
    if (currentNode.nextOnMatch && currentNode.nextOnMatch[intent]) {
      nextNodeId = currentNode.nextOnMatch[intent];
    }
    
    const nextNode = flow.nodes[nextNodeId];
    if (!nextNode) {
      return { response: "Error en el flujo de conversación.", shouldEnd: true };
    }
    
    state.currentNodeId = nextNodeId;
    
    let responseMessage = nextNode.message;
    for (const [key, slot] of Object.entries(state.slots)) {
      responseMessage = responseMessage.replace(`{${key}}`, slot.value);
    }
    
    if (nextNode.type === "action" && nextNode.action) {
      const actionResult = await executeFlowAction(nextNode.action, state, agent);
      responseMessage = responseMessage.replace("{availability}", actionResult.data || "");
      
      if (nextNode.defaultNext) {
        state.currentNodeId = nextNode.defaultNext;
      }
    }
    
    state.history.push(`Agente: ${responseMessage}`);
    
    const shouldEnd = nextNode.type === "end";
    
    return { 
      response: responseMessage, 
      shouldEnd,
      action: nextNode.type === "transfer" ? "transfer" : undefined
    };
    
  } catch (error: any) {
    console.error("Error processing flow input:", error);
    return { 
      response: "Disculpe, ocurrió un error. ¿Puede repetir su solicitud?", 
      shouldEnd: false 
    };
  }
}

async function executeFlowAction(
  action: string,
  state: ConversationState,
  agent: AIVoiceAgent
): Promise<{ success: boolean; data?: string }> {
  const calendarPolicy = agent.calendarPolicy as any;
  const targetUserId = calendarPolicy?.linkedCalendarUserId || state.userId;
  
  switch (action) {
    case "check_calendar": {
      try {
        const availability = await storage.getCalendarAvailability(targetUserId);
        const events = await storage.getCalendarEventsByUserId(targetUserId);
        
        const today = new Date();
        const availableSlots: string[] = [];
        
        for (let i = 0; i < 7 && availableSlots.length < 3; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);
          const dayOfWeek = checkDate.getDay();
          const dateStr = checkDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
          
          const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek && a.isActive);
          if (dayAvailability.length > 0) {
            const slot = dayAvailability[0];
            availableSlots.push(`${dateStr} de ${slot.startTime} a ${slot.endTime}`);
          }
        }
        
        if (availableSlots.length === 0) {
          return { success: true, data: "No tenemos horarios disponibles esta semana" };
        }
        
        return { success: true, data: availableSlots.join(", o ") };
      } catch (error) {
        return { success: false, data: "para los próximos días" };
      }
    }
    
    case "book_appointment": {
      try {
        const dateSlot = state.slots.date?.value;
        const timeSlot = state.slots.time?.value;
        
        if (!dateSlot || !timeSlot) {
          return { success: false };
        }
        
        const startTime = parseDateTimeSlots(dateSlot, timeSlot);
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        
        await storage.createCalendarEvent({
          userId: targetUserId,
          title: `Cita - ${state.callerPhone}`,
          description: `Cita agendada por teléfono. Tel: ${state.callerPhone}`,
          startTime,
          endTime,
          status: "confirmed",
          isPublicBooking: false,
        });
        
        return { success: true };
      } catch (error) {
        console.error("Error booking appointment:", error);
        return { success: false };
      }
    }
    
    case "create_lead": {
      try {
        const nameSlot = state.slots.name?.value || "Cliente";
        const emailSlot = state.slots.email?.value;
        
        const nameParts = nameSlot.split(' ');
        
        await storage.createLead({
          userId: state.userId,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ') || '',
          phone: state.callerPhone,
          email: emailSlot,
          source: "voice_call",
          status: "new",
          notes: `Llamada entrante: ${state.history.join('\n')}`,
          currency: "MXN",
        });
        
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    }
    
    default:
      return { success: false };
  }
}

function parseDateTimeSlots(dateStr: string, timeStr: string): Date {
  const now = new Date();
  let targetDate = new Date(now);
  
  const dateLower = dateStr.toLowerCase();
  if (dateLower === "hoy") {
  } else if (dateLower === "mañana") {
    targetDate.setDate(now.getDate() + 1);
  } else if (dateLower === "pasado mañana") {
    targetDate.setDate(now.getDate() + 2);
  } else {
    const dayNames = ["domingo", "lunes", "martes", "miércoles", "miercoles", "jueves", "viernes", "sábado", "sabado"];
    const dayIndex = dayNames.findIndex(d => dateLower.includes(d));
    if (dayIndex !== -1) {
      const actualDayIndex = dayIndex > 3 ? dayIndex - 1 : dayIndex;
      const currentDay = now.getDay();
      let daysToAdd = actualDayIndex - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7;
      targetDate.setDate(now.getDate() + daysToAdd);
    }
  }
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  targetDate.setHours(hours, minutes || 0, 0, 0);
  
  return targetDate;
}

export function endFlowConversation(callSid: string): {
  transcript: string;
  duration: number;
  slotsCollected: Record<string, string>;
} {
  const state = activeConversations.get(callSid);
  
  if (!state) {
    return { transcript: "", duration: 0, slotsCollected: {} };
  }
  
  const duration = Math.floor((Date.now() - state.startTime.getTime()) / 1000);
  const transcript = state.history.join('\n');
  const slotsCollected: Record<string, string> = {};
  
  for (const [key, slot] of Object.entries(state.slots)) {
    slotsCollected[key] = slot.value;
  }
  
  activeConversations.delete(callSid);
  
  return { transcript, duration, slotsCollected };
}

export function getActiveConversation(callSid: string): ConversationState | undefined {
  return activeConversations.get(callSid);
}
