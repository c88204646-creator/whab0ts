import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const TTS_CACHE_DIR = path.join(process.cwd(), "public", "tts-cache");

const memoryCache = new Map<string, { path: string; timestamp: number }>();
const MAX_CACHE_ENTRIES = 200;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas

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
    
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES + 50);
    for (const [key] of toRemove) {
      memoryCache.delete(key);
    }
    console.log(`🧹 Limpiados ${toRemove.length} entradas de caché TTS`);
  }
}

export async function generateTTSAudio(
  text: string,
  voiceId: string = "TX3LPaxmHKxFdv7VOQHJ"
): Promise<string | null> {
  await ensureTTSCacheDir();
  
  const cacheKey = generateCacheKey(text, voiceId);
  const audioFileName = `${cacheKey}.mp3`;
  const audioFilePath = path.join(TTS_CACHE_DIR, audioFileName);
  const publicUrl = `/tts-cache/${audioFileName}`;
  
  // Verificar caché en memoria
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey)!;
    try {
      await fs.access(cached.path);
      console.log(`✅ TTS desde caché: "${text.substring(0, 30)}..."`);
      return publicUrl;
    } catch {
      memoryCache.delete(cacheKey);
    }
  }
  
  // Verificar caché en disco
  try {
    await fs.access(audioFilePath);
    memoryCache.set(cacheKey, { path: audioFilePath, timestamp: Date.now() });
    console.log(`✅ TTS desde disco: "${text.substring(0, 30)}..."`);
    return publicUrl;
  } catch {
    // No existe en caché, generar
  }
  
  if (!ELEVENLABS_API_KEY) {
    console.error("❌ ElevenLabs API key no configurada");
    return null;
  }
  
  try {
    console.log(`🔊 Generando TTS con ElevenLabs: "${text.substring(0, 40)}..."`);
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true,
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
    
    console.log(`✅ TTS generado y cacheado: ${audioBuffer.length} bytes`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Error generando TTS:", error);
    return null;
  }
}

// Pre-cargar respuestas comunes para reducir latencia
const COMMON_RESPONSES = [
  "¡Hola! Gracias por llamar. ¿En qué puedo ayudarle hoy?",
  "¿Hay algo más en que pueda ayudarle?",
  "Gracias por su llamada. ¡Que tenga un excelente día!",
  "Lo siento, no entendí bien. ¿Podría repetir por favor?",
  "Entendido, un momento por favor.",
  "Claro, con mucho gusto.",
  "¿Sigue ahí? No detecté audio.",
  "Permítame revisar esa información.",
  "Listo, está confirmado.",
  "De nada, fue un placer ayudarle.",
  "No escuché nada. ¿Hay algo en que pueda ayudarle?",
  "Disculpe, ¿podría repetir?",
];

export async function preloadCommonTTS(voiceId: string = "TX3LPaxmHKxFdv7VOQHJ") {
  console.log("📦 Pre-cargando respuestas TTS comunes...");
  
  let preloaded = 0;
  for (const text of COMMON_RESPONSES) {
    const url = await generateTTSAudio(text, voiceId);
    if (url) preloaded++;
    await new Promise(r => setTimeout(r, 300)); // Rate limit
  }
  
  console.log(`📦 Pre-carga TTS completada: ${preloaded}/${COMMON_RESPONSES.length}`);
}

export function getTTSCacheStats() {
  return {
    memoryCacheSize: memoryCache.size,
    maxCacheEntries: MAX_CACHE_ENTRIES,
  };
}
