import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { storage } from "./storage";
import { 
  initializeFlowConversation, 
  processFlowInput, 
  endFlowConversation,
  getActiveConversation 
} from "./voice-flow-engine";

interface MediaStreamConnection {
  callSid: string;
  streamSid: string;
  agentId: string;
  ws: WebSocket;
  audioBuffer: Buffer[];
  isProcessing: boolean;
  lastAudioTime: number;
  silenceTimer?: NodeJS.Timeout;
  silenceCounter: number;
  inactivityCheckTimer?: NodeJS.Timeout;
}

const activeStreams = new Map<string, MediaStreamConnection>();

const audioCache = new Map<string, Buffer>();

const SILENCE_THRESHOLD_MS = 3500;
const MAX_AUDIO_BUFFER_SIZE = 100;
const CALL_MAX_DURATION_MS = 15 * 60 * 1000; // 15 minutos máximo
const INACTIVITY_THRESHOLD_MS = 8000; // 8 segundos sin audio = verificar si sigue en línea
const CHECK_ALIVE_MESSAGE = "¿Sigue ahí? No detecté audio. ¿Hay algo más que pueda hacer por usted?";

export function setupTwilioMediaStream(wss: WebSocketServer) {
  console.log("🎙️ Setting up Twilio Media Stream WebSocket handler");
  
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    console.log("📞 Incoming WebSocket connection for media stream");
    console.log(`   URL: ${req.url}`);
    
    // agentId will be extracted from the start message customParameters
    let pendingAgentId: string | null = null;
    
    // Try to get agentId from URL first (fallback)
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    pendingAgentId = url.searchParams.get("agentId");
    
    console.log(`📞 New Twilio Media Stream connection (agentId from URL: ${pendingAgentId || 'will be in start message'})`);
    
    let connection: MediaStreamConnection | null = null;
    
    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.event) {
          case "connected":
            console.log("🔗 Media stream connected");
            break;
            
          case "start":
            const { callSid, streamSid, customParameters } = message.start;
            console.log(`📞 Call started - CallSid: ${callSid}, StreamSid: ${streamSid}`);
            console.log(`📞 Custom Parameters:`, customParameters);
            
            // Get agentId from customParameters (Twilio sends <Parameter> values here)
            const agentId = customParameters?.agentId || pendingAgentId;
            
            if (!agentId) {
              console.error("❌ No agentId provided in customParameters or URL");
              ws.close();
              return;
            }
            
            console.log(`📞 Using agentId: ${agentId}`);
            
            connection = {
              callSid,
              streamSid,
              agentId,
              ws,
              audioBuffer: [],
              isProcessing: false,
              lastAudioTime: Date.now(),
              silenceCounter: 0
            };
            
            // Iniciar verificación de inactividad cada 5 segundos
            connection.inactivityCheckTimer = setInterval(() => {
              if (connection && !connection.isProcessing) {
                const timeSinceLastAudio = Date.now() - connection.lastAudioTime;
                if (timeSinceLastAudio > INACTIVITY_THRESHOLD_MS && connection.silenceCounter === 0) {
                  connection.silenceCounter++;
                  console.log(`⏳ Inactividad detectada por ${timeSinceLastAudio}ms. Verificando si sigue en línea...`);
                  sendTextToSpeech(connection, CHECK_ALIVE_MESSAGE);
                }
              }
            }, 5000);
            
            activeStreams.set(callSid, connection);
            
            console.log("🎤 Initializing flow conversation...");
            const initResult = await initializeFlowConversation(agentId, callSid, "");
            console.log("🎤 Init result:", JSON.stringify(initResult));
            
            if (initResult.success && initResult.greeting) {
              console.log("🔊 Sending greeting TTS:", initResult.greeting.substring(0, 50) + "...");
              await sendTextToSpeech(connection, initResult.greeting);
              console.log("🔊 Greeting sent successfully");
            } else {
              console.log("⚠️ No greeting to send - success:", initResult.success, "greeting:", !!initResult.greeting);
            }
            break;
            
          case "media":
            if (!connection) break;
            
            connection.lastAudioTime = Date.now();
            
            if (connection.audioBuffer.length < MAX_AUDIO_BUFFER_SIZE) {
              const audioData = Buffer.from(message.media.payload, "base64");
              connection.audioBuffer.push(audioData);
              connection.silenceCounter = 0; // Reset contador de inactividad cuando hay audio
            }
            
            if (connection.silenceTimer) {
              clearTimeout(connection.silenceTimer);
            }
            
            connection.silenceTimer = setTimeout(async () => {
              if (connection && connection.audioBuffer.length > 0 && !connection.isProcessing) {
                await processAudioBuffer(connection);
              }
            }, SILENCE_THRESHOLD_MS);
            break;
            
          case "stop":
            console.log("📞 Media stream stopped");
            if (connection) {
              if (connection.silenceTimer) clearTimeout(connection.silenceTimer);
              if (connection.inactivityCheckTimer) clearInterval(connection.inactivityCheckTimer);
              
              const result = endFlowConversation(connection.callSid);
              
              await storage.updateAIVoiceCallByCallSid(connection.callSid, {
                status: "completed",
                duration: result.duration,
                transcript: result.transcript,
              });
              
              activeStreams.delete(connection.callSid);
            }
            break;
            
          case "mark":
            break;
        }
      } catch (error) {
        console.error("Error processing media stream message:", error);
      }
    });
    
    ws.on("close", () => {
      console.log("📞 Media stream WebSocket closed");
      if (connection) {
        if (connection.silenceTimer) clearTimeout(connection.silenceTimer);
        if (connection.inactivityCheckTimer) clearInterval(connection.inactivityCheckTimer);
        activeStreams.delete(connection.callSid);
      }
    });
    
    ws.on("error", (error) => {
      console.error("Media stream WebSocket error:", error);
    });
  });
}

async function processAudioBuffer(connection: MediaStreamConnection) {
  if (connection.isProcessing || connection.audioBuffer.length === 0) {
    return;
  }
  
  connection.isProcessing = true;
  
  try {
    const audioData = Buffer.concat(connection.audioBuffer);
    connection.audioBuffer = [];
    
    const transcribedText = await transcribeAudio(audioData);
    
    if (!transcribedText || transcribedText.trim().length < 2) {
      connection.isProcessing = false;
      return;
    }
    
    console.log(`🎤 Transcribed: "${transcribedText}"`);
    
    const result = await processFlowInput(connection.callSid, transcribedText);
    
    console.log(`🤖 Response: "${result.response}"`);
    
    if (result.response) {
      await sendTextToSpeech(connection, result.response);
    }
    
    if (result.shouldEnd) {
      const endResult = endFlowConversation(connection.callSid);
      
      await storage.updateAIVoiceCallByCallSid(connection.callSid, {
        status: "completed",
        duration: endResult.duration,
        transcript: endResult.transcript,
      });
      
      sendHangupCommand(connection);
    }
    
    if (result.action === "transfer") {
      sendTransferCommand(connection);
    }
    
  } catch (error) {
    console.error("Error processing audio buffer:", error);
  } finally {
    connection.isProcessing = false;
  }
}

async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.error("OpenAI API key not configured");
      return "";
    }
    
    const FormData = (await import("form-data")).default;
    const formData = new FormData();
    
    formData.append("file", audioBuffer, {
      filename: "audio.wav",
      contentType: "audio/wav",
    });
    formData.append("model", "whisper-1");
    formData.append("language", "es");
    
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Whisper API error:", error);
      return "";
    }
    
    const result = await response.json() as { text: string };
    return result.text || "";
    
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return "";
  }
}

async function sendTextToSpeech(connection: MediaStreamConnection, text: string) {
  try {
    const cacheKey = text.toLowerCase().trim();
    let audioBuffer: Buffer | undefined = audioCache.get(cacheKey);
    
    if (!audioBuffer) {
      const generated = await generateSpeech(text, connection.agentId);
      audioBuffer = generated || undefined;
      
      if (audioBuffer && text.length < 100) {
        audioCache.set(cacheKey, audioBuffer);
        
        if (audioCache.size > 100) {
          const firstKey = audioCache.keys().next().value;
          if (firstKey) audioCache.delete(firstKey);
        }
      }
    }
    
    if (audioBuffer) {
      sendAudioToTwilio(connection, audioBuffer);
    }
    
  } catch (error) {
    console.error("Error in text-to-speech:", error);
  }
}

async function generateSpeech(text: string, agentId: string): Promise<Buffer | null> {
  try {
    const agent = await storage.getAIVoiceAgent(agentId);
    const voiceId = agent?.voiceId || "21m00Tcm4TlvDq8ikWAM";
    
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      console.error("ElevenLabs API key not configured");
      return null;
    }
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          },
          output_format: "ulaw_8000"
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs API error:", error);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
    
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
}

function sendAudioToTwilio(connection: MediaStreamConnection, audioBuffer: Buffer) {
  const CHUNK_SIZE = 640;
  
  for (let i = 0; i < audioBuffer.length; i += CHUNK_SIZE) {
    const chunk = audioBuffer.slice(i, i + CHUNK_SIZE);
    const base64Audio = chunk.toString("base64");
    
    const mediaMessage = {
      event: "media",
      streamSid: connection.streamSid,
      media: {
        payload: base64Audio
      }
    };
    
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(mediaMessage));
    }
  }
  
  const markMessage = {
    event: "mark",
    streamSid: connection.streamSid,
    mark: {
      name: "audio_complete"
    }
  };
  
  if (connection.ws.readyState === WebSocket.OPEN) {
    connection.ws.send(JSON.stringify(markMessage));
  }
}

function sendHangupCommand(connection: MediaStreamConnection) {
  setTimeout(() => {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.close();
    }
  }, 2000);
}

function sendTransferCommand(connection: MediaStreamConnection) {
  console.log(`📞 Transfer requested for call: ${connection.callSid}`);
}

export function getActiveStreamCount(): number {
  return activeStreams.size;
}

export function getStreamStats(): { 
  activeStreams: number; 
  cachedResponses: number;
} {
  return {
    activeStreams: activeStreams.size,
    cachedResponses: audioCache.size
  };
}
