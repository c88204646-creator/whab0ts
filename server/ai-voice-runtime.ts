import OpenAI from "openai";
import { storage } from "./storage";
import type { AIVoiceAgent, CompanyProfile, AgentProduct, AgentService, AgentFAQ, CalendarPolicy, ToolPermissions, AgentPersonality } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ConversationContext {
  agentId: string;
  userId: string;
  callSid: string;
  language: string;
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  callerPhone: string;
  callerName?: string;
  appointmentCreated: boolean;
  leadCreated: boolean;
}

const activeConversations = new Map<string, ConversationContext>();

const TOOL_DEFINITIONS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_calendar_availability",
      description: "Get available time slots for booking appointments. Use this when the caller wants to schedule a meeting or appointment.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "The date to check availability for in YYYY-MM-DD format"
          },
          daysAhead: {
            type: "number",
            description: "Number of days ahead to check (default 7)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_appointment",
      description: "Book an appointment for the caller. Use this after confirming the time slot with the caller.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title or purpose of the appointment"
          },
          startTime: {
            type: "string",
            description: "Start time in ISO format (YYYY-MM-DDTHH:MM:SS)"
          },
          endTime: {
            type: "string",
            description: "End time in ISO format (YYYY-MM-DDTHH:MM:SS)"
          },
          contactName: {
            type: "string",
            description: "Name of the person booking the appointment"
          },
          contactPhone: {
            type: "string",
            description: "Phone number of the person"
          },
          contactEmail: {
            type: "string",
            description: "Email of the person (optional)"
          },
          notes: {
            type: "string",
            description: "Additional notes about the appointment"
          }
        },
        required: ["title", "startTime", "endTime", "contactName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_company_info",
      description: "Get information about the company, business hours, contact details, etc.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_products",
      description: "Get the list of products available. Use when caller asks about products, prices, or what's available to purchase.",
      parameters: {
        type: "object",
        properties: {
          searchTerm: {
            type: "string",
            description: "Optional search term to filter products"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_services",
      description: "Get the list of services offered. Use when caller asks about services, their duration, or pricing.",
      parameters: {
        type: "object",
        properties: {
          searchTerm: {
            type: "string",
            description: "Optional search term to filter services"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_faq",
      description: "Search frequently asked questions for relevant answers. Use when the caller has a common question.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question or topic to search for"
          }
        },
        required: ["question"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_lead",
      description: "Create a new lead/potential client record. Use when caller expresses interest but doesn't book immediately.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the potential client"
          },
          phone: {
            type: "string",
            description: "Phone number"
          },
          email: {
            type: "string",
            description: "Email address (optional)"
          },
          interest: {
            type: "string",
            description: "What they're interested in"
          },
          notes: {
            type: "string",
            description: "Additional notes from the conversation"
          }
        },
        required: ["name", "phone", "interest"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_client_info",
      description: "Look up existing client information by phone number.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "Phone number to look up"
          }
        },
        required: ["phone"]
      }
    }
  }
];

function buildSystemPrompt(agent: AIVoiceAgent): string {
  const companyProfile = agent.companyProfile as CompanyProfile;
  const products = agent.products as AgentProduct[];
  const services = agent.services as AgentService[];
  const faqs = agent.faqs as AgentFAQ[];
  const personality = agent.personality as AgentPersonality;
  const toolPermissions = agent.toolPermissions as ToolPermissions;
  
  const languageInstructions = agent.language === 'es' 
    ? 'Debes responder SIEMPRE en español. Si el usuario habla en inglés, responde amablemente en español.'
    : 'You must ALWAYS respond in English. If the user speaks Spanish, respond politely in English.';

  let systemPrompt = `${agent.systemPrompt}

${languageInstructions}

## Tu Personalidad
- Saludo: "${personality.greeting}"
- Despedida: "${personality.farewell}"
- Tono: ${personality.tone === 'professional' ? 'Profesional y cortés' : personality.tone === 'friendly' ? 'Amigable y cercano' : 'Formal y respetuoso'}
- Enfoque de ventas: ${personality.salesApproach === 'consultative' ? 'Consultivo - haz preguntas para entender las necesidades' : personality.salesApproach === 'direct' ? 'Directo - ofrece soluciones rápidamente' : 'Pasivo - responde solo cuando pregunten'}
${personality.handlingObjections ? '- Maneja objeciones de forma empática y busca soluciones alternativas.' : ''}

## Información de la Empresa
- Nombre: ${companyProfile.businessName || 'No especificado'}
- Industria: ${companyProfile.industry || 'No especificada'}
- Descripción: ${companyProfile.about || 'No disponible'}
- Horario: ${companyProfile.workingHours || 'No especificado'}
- Teléfonos: ${companyProfile.phones?.join(', ') || 'No disponibles'}
- Direcciones: ${companyProfile.addresses?.join(', ') || 'No disponibles'}
- Sitio web: ${companyProfile.website || 'No disponible'}

## Tus Capacidades
${toolPermissions.canBookAppointments ? '- Puedes agendar citas y verificar disponibilidad' : '- NO puedes agendar citas'}
${toolPermissions.canCheckAvailability ? '- Puedes consultar la disponibilidad del calendario' : ''}
${toolPermissions.canCreateLead ? '- Puedes registrar leads/prospectos interesados' : ''}
${toolPermissions.canTakeOrders ? '- Puedes tomar pedidos' : '- NO puedes tomar pedidos directamente'}
${toolPermissions.canAccessClientData ? '- Puedes buscar información de clientes existentes' : ''}

## Reglas Importantes
1. Sé conciso pero completo en tus respuestas.
2. Si no tienes información, admítelo honestamente y ofrece alternativas.
3. Siempre confirma los datos importantes (fechas, nombres, teléfonos) repitiendo la información.
4. No inventes información que no tengas.
5. Si el cliente quiere hablar con un humano, ofrece tomar sus datos para que alguien le devuelva la llamada.`;

  if (products.length > 0) {
    systemPrompt += `\n\n## Productos Disponibles\n`;
    products.forEach(p => {
      systemPrompt += `- ${p.name}: ${p.shortDesc} - $${p.price} ${p.currency}${p.inStock ? '' : ' (Agotado)'}\n`;
    });
  }

  if (services.length > 0) {
    systemPrompt += `\n\n## Servicios Ofrecidos\n`;
    services.forEach(s => {
      systemPrompt += `- ${s.name}: ${s.description} - ${s.durationMinutes} min - $${s.price} ${s.currency}\n`;
    });
  }

  if (faqs.length > 0) {
    systemPrompt += `\n\n## Preguntas Frecuentes\n`;
    faqs.forEach(f => {
      systemPrompt += `P: ${f.question}\nR: ${f.answer}\n\n`;
    });
  }

  return systemPrompt;
}

async function executeToolCall(
  toolName: string,
  args: any,
  context: ConversationContext,
  agent: AIVoiceAgent
): Promise<string> {
  const calendarPolicy = agent.calendarPolicy as CalendarPolicy;
  const companyProfile = agent.companyProfile as CompanyProfile;
  const products = agent.products as AgentProduct[];
  const services = agent.services as AgentService[];
  const faqs = agent.faqs as AgentFAQ[];
  const toolPermissions = agent.toolPermissions as ToolPermissions;

  try {
    switch (toolName) {
      case "get_calendar_availability": {
        if (!toolPermissions.canCheckAvailability) {
          return JSON.stringify({ error: "No tengo acceso al calendario en este momento." });
        }
        
        const targetUserId = calendarPolicy.linkedCalendarUserId || context.userId;
        const availability = await storage.getCalendarAvailability(targetUserId);
        const events = await storage.getCalendarEventsByUserId(targetUserId);
        
        const today = new Date();
        const daysAhead = args.daysAhead || 7;
        const availableSlots: { date: string; times: string[] }[] = [];
        
        for (let i = 0; i < daysAhead; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);
          const dayOfWeek = checkDate.getDay();
          const dateStr = checkDate.toISOString().split('T')[0];
          
          const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek && a.isActive);
          const dayEvents = events.filter(e => {
            const eventDate = new Date(e.startTime).toISOString().split('T')[0];
            return eventDate === dateStr && e.status !== 'cancelled';
          });
          
          const times: string[] = [];
          dayAvailability.forEach(slot => {
            const [startHour] = slot.startTime.split(':').map(Number);
            const [endHour] = slot.endTime.split(':').map(Number);
            
            for (let hour = startHour; hour < endHour; hour++) {
              const timeStr = `${hour.toString().padStart(2, '0')}:00`;
              const isBooked = dayEvents.some(e => {
                const eventHour = new Date(e.startTime).getHours();
                return eventHour === hour;
              });
              if (!isBooked) {
                times.push(timeStr);
              }
            }
          });
          
          if (times.length > 0) {
            availableSlots.push({ date: dateStr, times });
          }
        }
        
        return JSON.stringify({ 
          availableSlots,
          message: availableSlots.length > 0 
            ? "Estos son los horarios disponibles" 
            : "No hay horarios disponibles en los próximos días"
        });
      }

      case "create_appointment": {
        if (!toolPermissions.canBookAppointments) {
          return JSON.stringify({ error: "No puedo agendar citas en este momento." });
        }
        
        const targetUserId = calendarPolicy.linkedCalendarUserId || context.userId;
        const startTime = new Date(args.startTime);
        const endTime = new Date(args.endTime);
        
        const minNotice = new Date();
        minNotice.setMinutes(minNotice.getMinutes() + calendarPolicy.minNoticeMinutes);
        
        if (startTime < minNotice) {
          return JSON.stringify({ 
            error: `La cita debe agendarse con al menos ${calendarPolicy.minNoticeMinutes} minutos de anticipación.` 
          });
        }
        
        const event = await storage.createCalendarEvent({
          userId: targetUserId,
          title: args.title,
          description: args.notes || null,
          startTime,
          endTime,
          contactName: args.contactName,
          contactPhone: args.contactPhone || context.callerPhone,
          email: args.contactEmail || null,
          status: "confirmed",
          isActive: true,
          isPublicBooking: false,
          clientId: null,
          leadId: null,
        });
        
        context.appointmentCreated = true;
        
        return JSON.stringify({ 
          success: true,
          message: calendarPolicy.confirmationMessage,
          appointment: {
            date: startTime.toLocaleDateString('es-MX'),
            time: startTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            title: args.title
          }
        });
      }

      case "get_company_info": {
        return JSON.stringify({
          businessName: companyProfile.businessName,
          industry: companyProfile.industry,
          about: companyProfile.about,
          workingHours: companyProfile.workingHours,
          phones: companyProfile.phones,
          addresses: companyProfile.addresses,
          website: companyProfile.website
        });
      }

      case "get_products": {
        let filtered = products;
        if (args.searchTerm) {
          const term = args.searchTerm.toLowerCase();
          filtered = products.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.shortDesc.toLowerCase().includes(term) ||
            p.tags?.some(t => t.toLowerCase().includes(term))
          );
        }
        return JSON.stringify({ 
          products: filtered.map(p => ({
            name: p.name,
            description: p.shortDesc,
            price: `$${p.price} ${p.currency}`,
            available: p.inStock
          })),
          count: filtered.length
        });
      }

      case "get_services": {
        let filtered = services;
        if (args.searchTerm) {
          const term = args.searchTerm.toLowerCase();
          filtered = services.filter(s => 
            s.name.toLowerCase().includes(term) || 
            s.description.toLowerCase().includes(term) ||
            s.tags?.some(t => t.toLowerCase().includes(term))
          );
        }
        return JSON.stringify({ 
          services: filtered.map(s => ({
            name: s.name,
            description: s.description,
            duration: `${s.durationMinutes} minutos`,
            price: `$${s.price} ${s.currency}`
          })),
          count: filtered.length
        });
      }

      case "search_faq": {
        const question = args.question.toLowerCase();
        const matches = faqs.filter(f => 
          f.question.toLowerCase().includes(question) ||
          f.answer.toLowerCase().includes(question) ||
          f.tags?.some(t => t.toLowerCase().includes(question))
        );
        
        if (matches.length === 0) {
          return JSON.stringify({ 
            found: false,
            message: "No encontré una respuesta exacta a esa pregunta."
          });
        }
        
        return JSON.stringify({
          found: true,
          answers: matches.map(m => ({
            question: m.question,
            answer: m.answer
          }))
        });
      }

      case "create_lead": {
        if (!toolPermissions.canCreateLead) {
          return JSON.stringify({ error: "No puedo registrar leads en este momento." });
        }
        
        const nameParts = args.name.trim().split(' ');
        const firstName = nameParts[0] || args.name;
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const lead = await storage.createLead({
          userId: context.userId,
          firstName,
          lastName,
          phone: args.phone,
          email: args.email || null,
          source: "ai_voice_agent",
          status: "new",
          notes: `Interés: ${args.interest}\n${args.notes || ''}`,
          currency: "MXN",
        });
        
        context.leadCreated = true;
        
        return JSON.stringify({
          success: true,
          message: "He registrado sus datos. Alguien se pondrá en contacto pronto."
        });
      }

      case "get_client_info": {
        if (!toolPermissions.canAccessClientData) {
          return JSON.stringify({ error: "No tengo acceso a la información de clientes." });
        }
        
        const clients = await storage.getClientsByUserId(context.userId);
        const client = clients.find(c => c.phone === args.phone);
        
        if (!client) {
          return JSON.stringify({ found: false, message: "No encontré información de este cliente." });
        }
        
        return JSON.stringify({
          found: true,
          client: {
            name: `${client.firstName} ${client.lastName}`.trim(),
            email: client.email,
            notes: client.notes,
            company: client.company
          }
        });
      }

      default:
        return JSON.stringify({ error: "Función no disponible" });
    }
  } catch (error: any) {
    console.error(`Error executing tool ${toolName}:`, error);
    return JSON.stringify({ error: `Error al ejecutar la acción: ${error.message}` });
  }
}

export async function initializeConversation(
  agentId: string,
  callSid: string,
  callerPhone: string
): Promise<{ success: boolean; greeting: string; error?: string }> {
  try {
    const agent = await storage.getAIVoiceAgent(agentId);
    if (!agent) {
      return { success: false, greeting: "", error: "Agente no encontrado" };
    }

    const personality = agent.personality as AgentPersonality;
    const systemPrompt = buildSystemPrompt(agent);

    const context: ConversationContext = {
      agentId,
      userId: agent.userId,
      callSid,
      language: agent.language,
      callerPhone,
      appointmentCreated: false,
      leadCreated: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "assistant", content: personality.greeting }
      ]
    };

    activeConversations.set(callSid, context);

    return { success: true, greeting: personality.greeting };
  } catch (error: any) {
    console.error("Error initializing conversation:", error);
    return { success: false, greeting: "", error: error.message };
  }
}

export async function processUserInput(
  callSid: string,
  userMessage: string
): Promise<{ response: string; shouldEnd: boolean }> {
  const context = activeConversations.get(callSid);
  if (!context) {
    return { response: "Lo siento, ha ocurrido un error. Por favor, llame de nuevo.", shouldEnd: true };
  }

  try {
    const agent = await storage.getAIVoiceAgent(context.agentId);
    if (!agent) {
      return { response: "Lo siento, no puedo continuar esta llamada.", shouldEnd: true };
    }

    const toolPermissions = agent.toolPermissions as ToolPermissions;
    
    const availableTools = TOOL_DEFINITIONS.filter(tool => {
      const fn = (tool as any).function;
      if (!fn) return true;
      switch (fn.name) {
        case "get_calendar_availability":
          return toolPermissions.canCheckAvailability;
        case "create_appointment":
          return toolPermissions.canBookAppointments;
        case "create_lead":
          return toolPermissions.canCreateLead;
        case "get_client_info":
          return toolPermissions.canAccessClientData;
        default:
          return true;
      }
    });

    context.messages.push({ role: "user", content: userMessage });

    let response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: context.messages,
      tools: availableTools.length > 0 ? availableTools : undefined,
      tool_choice: availableTools.length > 0 ? "auto" : undefined,
      max_tokens: 500,
      temperature: 0.7,
    });

    let assistantMessage = response.choices[0].message;

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      context.messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const tc = toolCall as any;
        const args = JSON.parse(tc.function.arguments);
        const result = await executeToolCall(tc.function.name, args, context, agent);
        
        context.messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result
        });
      }

      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: context.messages,
        tools: availableTools.length > 0 ? availableTools : undefined,
        tool_choice: availableTools.length > 0 ? "auto" : undefined,
        max_tokens: 500,
        temperature: 0.7,
      });

      assistantMessage = response.choices[0].message;
    }

    const finalResponse = assistantMessage.content || "Lo siento, no pude procesar su solicitud.";
    context.messages.push({ role: "assistant", content: finalResponse });

    const shouldEnd = userMessage.toLowerCase().includes("adios") ||
                      userMessage.toLowerCase().includes("adiós") ||
                      userMessage.toLowerCase().includes("goodbye") ||
                      userMessage.toLowerCase().includes("hasta luego") ||
                      userMessage.toLowerCase().includes("gracias, eso es todo");

    return { response: finalResponse, shouldEnd };
  } catch (error: any) {
    console.error("Error processing user input:", error);
    return { 
      response: "Lo siento, ha ocurrido un error técnico. ¿Puede repetir su pregunta?", 
      shouldEnd: false 
    };
  }
}

export async function endConversation(callSid: string): Promise<{
  transcript: string;
  summary: string;
  appointmentCreated: boolean;
  leadCreated: boolean;
}> {
  const context = activeConversations.get(callSid);
  if (!context) {
    return { transcript: "", summary: "", appointmentCreated: false, leadCreated: false };
  }

  try {
    const transcript = context.messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => `${m.role === "user" ? "Cliente" : "Agente"}: ${m.content}`)
      .join("\n");

    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Genera un resumen breve (máximo 3 oraciones) de esta conversación telefónica. Incluye el propósito de la llamada y el resultado."
        },
        { role: "user", content: transcript }
      ],
      max_tokens: 150,
    });

    const summary = summaryResponse.choices[0].message.content || "Llamada completada.";

    await storage.updateAIVoiceCall(callSid, {
      transcript,
      summary,
      appointmentCreated: context.appointmentCreated,
      leadCreated: context.leadCreated,
      status: "completed"
    });

    activeConversations.delete(callSid);

    return {
      transcript,
      summary,
      appointmentCreated: context.appointmentCreated,
      leadCreated: context.leadCreated
    };
  } catch (error: any) {
    console.error("Error ending conversation:", error);
    activeConversations.delete(callSid);
    return { transcript: "", summary: "", appointmentCreated: false, leadCreated: false };
  }
}

export function getActiveConversationsCount(): number {
  return activeConversations.size;
}
