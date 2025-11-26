import twilio from "twilio";
import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { getBaseUrl } from "./utils/get-base-url";
import { getEnvironment } from "@shared/environment";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";
const AUDIO_CACHE_DIR = path.join(process.cwd(), "public", "audio-cache");

// Ensure audio cache directory exists
async function ensureAudioCacheDir() {
  try {
    await fs.mkdir(AUDIO_CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating audio cache directory:", error);
  }
}

// Download audio preview from ElevenLabs and cache it locally
async function downloadAndCacheVoicePreview(voiceId: string, previewUrl: string) {
  try {
    const audioFileName = `${voiceId}.mp3`;
    const audioFilePath = path.join(AUDIO_CACHE_DIR, audioFileName);

    // Check if already cached
    try {
      await fs.access(audioFilePath);
      return `/audio-cache/${audioFileName}`;
    } catch {
      // File doesn't exist, download it
    }

    // Download from ElevenLabs
    const response = await fetch(previewUrl);
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);

    // Save to file
    const buffer = await response.arrayBuffer();
    await fs.writeFile(audioFilePath, Buffer.from(buffer));

    return `/audio-cache/${audioFileName}`;
  } catch (error) {
    console.error(`Error caching voice preview for ${voiceId}:`, error);
    return null;
  }
}

export async function getElevenLabsVoices() {
  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/v1/voices`, {
      headers: { "xi-api-key": ELEVENLABS_API_KEY || "" },
    });
    const data = await response.json();
    return data.voices || [];
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    return [];
  }
}

// Get voices with cached preview URLs
export async function getElevenLabsVoicesWithAudio() {
  try {
    await ensureAudioCacheDir();
    const voices = await getElevenLabsVoices();

    // Cache all voice previews in parallel
    const voicesWithPreview = await Promise.all(
      voices.map(async (voice: any) => {
        let previewUrl = null;

        if (voice.preview_url) {
          const cachedUrl = await downloadAndCacheVoicePreview(voice.voice_id, voice.preview_url);
          previewUrl = cachedUrl || voice.preview_url;
        }

        return {
          ...voice,
          preview_url: previewUrl,
        };
      })
    );

    return voicesWithPreview;
  } catch (error) {
    console.error("Error fetching voices with audio:", error);
    return [];
  }
}

// Get cached audio file
export async function getCachedVoiceAudio(voiceId: string) {
  try {
    const audioFilePath = path.join(AUDIO_CACHE_DIR, `${voiceId}.mp3`);
    await fs.access(audioFilePath);
    return audioFilePath;
  } catch (error) {
    console.error(`Cached audio not found for voice ${voiceId}:`, error);
    return null;
  }
}

export async function makeCallWithAgent(
  phoneNumber: string,
  agentPrompt: string,
  voiceId: string,
  agentId: string
) {
  try {
    // Validate required credentials
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error("Credenciales de Twilio no configuradas");
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("API Key de ElevenLabs no configurada");
    }

    // Construct callback URL - auto-detecta la URL correcta
    // IMPORTANTE: DEBE ser HTTPS y pública para que Twilio pueda hacer callbacks
    const env = getEnvironment();
    const baseUrl = getBaseUrl();
    
    console.log(`ℹ️ Entorno detectado: ${env.environment} | URL: ${baseUrl}`);
    
    // Validar que sea HTTPS en producción
    if (env.isProduction && !baseUrl.startsWith("https://")) {
      console.error(`❌ ERROR: Twilio requiere HTTPS en producción. URL actual: ${baseUrl}`);
      throw new Error("Twilio requiere URL HTTPS en producción. Configura APP_URL correctamente.");
    }

    const callbackUrl = `${baseUrl}/api/voice/twiml?agentId=${encodeURIComponent(agentId)}&agentPrompt=${encodeURIComponent(agentPrompt)}&voiceId=${encodeURIComponent(voiceId)}`;
    
    console.log(`🔔 Iniciando llamada Twilio`);
    console.log(`   Teléfono: ${phoneNumber}`);
    console.log(`   Desde: ${process.env.TWILIO_PHONE_NUMBER}`);
    console.log(`   Callback: ${callbackUrl}`);
    
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: callbackUrl,
      record: true,
      timeout: 60,
    });

    console.log(`✅ Llamada creada exitosamente - SID: ${call.sid}, Estado: ${call.status}`);
    
    return {
      success: true,
      callSid: call.sid,
      status: call.status,
    };
  } catch (error: any) {
    console.error("❌ Error making call:", error);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

export function generateTwiML(voiceId: string, prompt: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://stream.elevenlabs.io/v1/stream" name="elevenlabs">
      <Parameter name="api_key" value="${ELEVENLABS_API_KEY}" />
      <Parameter name="voice_id" value="${voiceId}" />
      <Parameter name="model_id" value="eleven_turbo_v2" />
      <Parameter name="system_prompt" value="${prompt}" />
    </Stream>
  </Connect>
</Response>`;
}
