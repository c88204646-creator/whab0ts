import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  trackTTSUsage,
  checkBudget,
  truncateResponse,
  shortenResponse,
  shouldUsePolly,
  getInflightRequest,
  setInflightRequest,
  getAllCanonicalPhrases,
} from "./tts-budget-manager";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const TTS_CACHE_DIR = path.join(process.cwd(), "public", "tts-cache");

const memoryCache = new Map<string, { path: string; timestamp: number }>();
const MAX_CACHE_ENTRIES = 500;
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 días (aumentado de 24h)

let totalCharsSaved = 0;
let totalCharsGenerated = 0;
let cacheHits = 0;
let cacheMisses = 0;

async function ensureTTSCacheDir() {
  try {
    await fs.mkdir(TTS_CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating TTS cache directory:", error);
  }
}

function generateCacheKey(text: string, voiceId: string): string {
  const hash = crypto.createHash("md5").update(`${voiceId}:${text}`).digest("hex");
  return hash;
}

function cleanupCache() {
  if (memoryCache.size > MAX_CACHE_ENTRIES) {
    const entries = Array.from(memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES + 100);
    for (const [key] of toRemove) {
      memoryCache.delete(key);
    }
    console.log(`🧹 Limpiados ${toRemove.length} entradas de caché TTS`);
  }
}

export interface TTSOptions {
  userId?: string;
  agentId?: string;
  isOperational?: boolean;
  forcePolly?: boolean;
  useTurbo?: boolean;
}

export async function generateTTSAudio(
  text: string,
  voiceId: string = "TX3LPaxmHKxFdv7VOQHJ",
  options: TTSOptions = {}
): Promise<string | null> {
  await ensureTTSCacheDir();
  
  let processedText = shortenResponse(text);
  processedText = truncateResponse(processedText, 200);
  
  const usePolly = options.forcePolly || shouldUsePolly(processedText, options.isOperational);
  
  if (options.userId) {
    const budget = checkBudget(options.userId, processedText.length);
    if (budget.usePolly) {
      console.log(`⚠️ Presupuesto: ${budget.reason} - usando Polly`);
      return null;
    }
  }
  
  const cacheKey = generateCacheKey(processedText, voiceId);
  const audioFileName = `${cacheKey}.mp3`;
  const audioFilePath = path.join(TTS_CACHE_DIR, audioFileName);
  const publicUrl = `/tts-cache/${audioFileName}`;
  
  const inflight = getInflightRequest(cacheKey);
  if (inflight) {
    console.log(`⏳ TTS en vuelo, esperando: "${processedText.substring(0, 25)}..."`);
    return inflight;
  }
  
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    try {
      await fs.access(cached.path);
      cacheHits++;
      totalCharsSaved += processedText.length;
      console.log(`✅ TTS caché [${cacheHits}/${cacheHits + cacheMisses}]: "${processedText.substring(0, 25)}..."`);
      return publicUrl;
    } catch {
      memoryCache.delete(cacheKey);
    }
  }
  
  try {
    await fs.access(audioFilePath);
    memoryCache.set(cacheKey, { path: audioFilePath, timestamp: Date.now() });
    cacheHits++;
    totalCharsSaved += processedText.length;
    console.log(`✅ TTS disco [${cacheHits}/${cacheHits + cacheMisses}]: "${processedText.substring(0, 25)}..."`);
    return publicUrl;
  } catch {
  }
  
  if (!ELEVENLABS_API_KEY) {
    console.error("❌ ElevenLabs API key no configurada");
    return null;
  }
  
  if (usePolly) {
    console.log(`🔇 Usando Polly para: "${processedText.substring(0, 30)}..."`);
    return null;
  }
  
  const generatePromise = (async (): Promise<string | null> => {
    try {
      cacheMisses++;
      totalCharsGenerated += processedText.length;
      
      console.log(`🔊 ElevenLabs [${processedText.length} chars]: "${processedText.substring(0, 35)}..."`);
      
      const modelId = options.useTurbo ? "eleven_turbo_v2_5" : "eleven_multilingual_v2";
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: processedText,
            model_id: modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.1,
              use_speaker_boost: false,
            },
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ ElevenLabs error: ${response.status} - ${error}`);
        return null;
      }
      
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(audioFilePath, audioBuffer);
      
      memoryCache.set(cacheKey, { path: audioFilePath, timestamp: Date.now() });
      cleanupCache();
      
      if (options.userId && options.agentId) {
        trackTTSUsage(options.userId, options.agentId, processedText.length);
      }
      
      console.log(`✅ TTS generado: ${audioBuffer.length} bytes, ahorrados: ${totalCharsSaved} chars`);
      return publicUrl;
    } catch (error) {
      console.error("❌ Error generando TTS:", error);
      return null;
    }
  })();
  
  setInflightRequest(cacheKey, generatePromise);
  return generatePromise;
}

const COMMON_RESPONSES_OPTIMIZED = [
  "¡Hola! ¿En qué puedo ayudarle?",
  "¿Algo más?",
  "Gracias. ¡Buen día!",
  "¿Puede repetir?",
  "Un momento.",
  "Claro.",
  "¿Sigue ahí?",
  "Confirmado.",
  "De nada.",
  "No escuché nada.",
  "¿Cuál es su nombre?",
  "¿Cuál es su teléfono?",
  "¿De qué país llama?",
  "¿Tiene correo?",
  "¿Para qué fecha?",
  "¿A qué hora?",
  "Cita agendada.",
  "Un agente le contactará.",
  "Le envío detalles por WhatsApp.",
  "Perfecto.",
  "Entendido.",
  "No hay disponibilidad para esa fecha.",
  "¿Le gustaría otra fecha?",
];

export async function preloadCommonTTS(voiceId: string = "TX3LPaxmHKxFdv7VOQHJ") {
  console.log("📦 Pre-cargando respuestas TTS optimizadas...");
  
  const allPhrases = [...COMMON_RESPONSES_OPTIMIZED, ...getAllCanonicalPhrases()];
  const uniquePhrases = [...new Set(allPhrases)];
  
  let preloaded = 0;
  let skipped = 0;
  
  for (const text of uniquePhrases) {
    const cacheKey = generateCacheKey(text, voiceId);
    const audioFilePath = path.join(TTS_CACHE_DIR, `${cacheKey}.mp3`);
    
    try {
      await fs.access(audioFilePath);
      memoryCache.set(cacheKey, { path: audioFilePath, timestamp: Date.now() });
      skipped++;
      continue;
    } catch {
    }
    
    const url = await generateTTSAudio(text, voiceId, { useTurbo: true });
    if (url) preloaded++;
    await new Promise(r => setTimeout(r, 250));
  }
  
  console.log(`📦 Pre-carga TTS: ${preloaded} nuevos, ${skipped} existentes, total: ${uniquePhrases.length}`);
}

export function getTTSCacheStats() {
  const hitRate = cacheHits + cacheMisses > 0 
    ? Math.round((cacheHits / (cacheHits + cacheMisses)) * 100) 
    : 0;
  
  return {
    memoryCacheSize: memoryCache.size,
    maxCacheEntries: MAX_CACHE_ENTRIES,
    cacheHits,
    cacheMisses,
    hitRate: `${hitRate}%`,
    totalCharsSaved,
    totalCharsGenerated,
    estimatedSavings: `$${((totalCharsSaved / 1000) * 0.30).toFixed(2)}`,
  };
}

export function resetTTSStats() {
  cacheHits = 0;
  cacheMisses = 0;
  totalCharsSaved = 0;
  totalCharsGenerated = 0;
}
