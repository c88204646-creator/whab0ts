import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { storage } from "./storage";
import { 
  initializeFlowConversation, 
  processFlowInput, 
  endFlowConversation,
  getActiveConversation 
} from "./voice-flow-engine";
import { transcribeAudio } from "./audio-transcription";

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

// Convierte mulaw 8kHz a WAV para transcripción
function mulawToLinear(mulawByte: number): number {
  const MULAW_BIAS = 33;
  mulawByte = ~mulawByte;
  const sign = (mulawByte & 0x80);
  const exponent = (mulawByte >> 4) & 0x07;
  let mantissa = mulawByte & 0x0F;
  let sample = (mantissa << 3) + MULAW_BIAS;
  sample <<= exponent;
  sample -= MULAW_BIAS;
  return sign !== 0 ? -sample : sample;
}

function convertMulawToWav(mulawBuffer: Buffer): Buffer {
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = mulawBuffer.length;
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;
  
  const wavBuffer = Buffer.alloc(fileSize);
  let offset = 0;
  
  wavBuffer.write('RIFF', offset); offset += 4;
  wavBuffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  wavBuffer.write('WAVE', offset); offset += 4;
  wavBuffer.write('fmt ', offset); offset += 4;
  wavBuffer.writeUInt32LE(16, offset); offset += 4;
  wavBuffer.writeUInt16LE(1, offset); offset += 2;
  wavBuffer.writeUInt16LE(numChannels, offset); offset += 2;
  wavBuffer.writeUInt32LE(sampleRate, offset); offset += 4;
  wavBuffer.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, offset); offset += 4;
  wavBuffer.writeUInt16LE(numChannels * bitsPerSample / 8, offset); offset += 2;
  wavBuffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
  wavBuffer.write('data', offset); offset += 4;
  wavBuffer.writeUInt32LE(dataSize, offset); offset += 4;
  
  for (let i = 0; i < mulawBuffer.length; i++) {
    const linearSample = mulawToLinear(mulawBuffer[i]);
    wavBuffer.writeInt16LE(linearSample, offset);
    offset += 2;
  }
  
  return wavBuffer;
}

// Procesa el audio del usuario con transcripción local (Xenova/Whisper)
async function processAudioBuffer(connection: MediaStreamConnection) {
  if (connection.isProcessing || connection.audioBuffer.length === 0) {
    return;
  }
  
  connection.isProcessing = true;
  
  try {
    const audioData = Buffer.concat(connection.audioBuffer);
    connection.audioBuffer = [];
    
    // Mínimo de audio para procesar (aprox 0.2 segundos a 8kHz)
    if (audioData.length < 1600) {
      console.log("⚠️ Audio muy corto, ignorando");
      connection.isProcessing = false;
      return;
    }
    
    console.log(`🎤 Procesando ${audioData.length} bytes de audio...`);
    
    // Convertir mulaw a WAV para transcripción
    const wavBuffer = convertMulawToWav(audioData);
    
    // Transcribir con Xenova/Whisper (modelo local open source)
    const transcribedText = await transcribeAudio(wavBuffer);
    
    if (!transcribedText || transcribedText.trim().length < 2) {
      console.log("⚠️ Transcripción vacía o muy corta");
      connection.isProcessing = false;
      return;
    }
    
    console.log(`🎤 Transcrito: "${transcribedText}"`);
    
    // Procesar con el flujo de conversación (sin API externa)
    const result = await processFlowInput(connection.callSid, transcribedText);
    
    console.log(`🤖 Respuesta: "${result.response?.substring(0, 50)}..."`);
    
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
    console.error("❌ Error procesando audio:", error);
  } finally {
    connection.isProcessing = false;
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
    console.log(`🔊 Generating speech for: "${text.substring(0, 40)}..."`);
    
    const agent = await storage.getAIVoiceAgent(agentId);
    const voiceId = agent?.voiceId || "21m00Tcm4TlvDq8ikWAM";
    
    console.log(`🔊 Using voice ID: ${voiceId}`);
    
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
      console.error("❌ ElevenLabs API key not configured");
      return null;
    }
    
    console.log(`🔊 Calling ElevenLabs API...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
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
            output_format: "mp3_44100_128"
          }),
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.text();
        console.error("❌ ElevenLabs API error:", response.status, error);
        return null;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`✅ Generated ${arrayBuffer.byteLength} bytes of MP3 audio`);
      return Buffer.from(arrayBuffer);
    } finally {
      clearTimeout(timeoutId);
    }
    
  } catch (error) {
    console.error("❌ Error generating speech:", error instanceof Error ? error.message : error);
    return null;
  }
}

function sendAudioToTwilio(connection: MediaStreamConnection, audioBuffer: Buffer) {
  const CHUNK_SIZE = 640;
  let chunksSent = 0;
  
  console.log(`📤 Sending ${audioBuffer.length} bytes of audio to Twilio in ${Math.ceil(audioBuffer.length / CHUNK_SIZE)} chunks`);
  
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
      chunksSent++;
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
  
  console.log(`✅ Sent ${chunksSent} audio chunks to Twilio`);
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
