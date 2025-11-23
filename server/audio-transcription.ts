import { pipeline, env } from "@xenova/transformers";

// Use local models only
env.allowLocalModels = true;
env.allowRemoteModels = false;

// Cache the pipeline
let transcriptionPipeline: any = null;

async function getTranscriptionPipeline() {
  if (!transcriptionPipeline) {
    console.log("[WHISPER] Initializing Whisper-Tiny model (first load may take 1-2 minutes)...");
    try {
      transcriptionPipeline = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
        quantized: true,
      });
      console.log("[WHISPER] Pipeline initialized successfully");
    } catch (error) {
      console.error("[WHISPER] Failed to initialize pipeline:", error);
      throw error;
    }
  }
  return transcriptionPipeline;
}

/**
 * Transcribe audio from buffer using Xenova/Whisper-Tiny
 * Open source, runs locally, supports multiple audio formats
 */
export async function transcribeAudio(mediaBuffer: Buffer): Promise<string | null> {
  if (!mediaBuffer || mediaBuffer.length === 0) {
    return null;
  }

  try {
    console.log("[WHISPER] Starting transcription for", mediaBuffer.length, "bytes of audio");
    
    const pipe = await getTranscriptionPipeline();
    
    // Whisper can handle various formats (ogg, mp3, wav, etc)
    const result = await pipe(mediaBuffer, {
      language: "spanish",
      chunk_length_s: 30,
      stride_length_s: 5,
    });

    const transcription = result?.text?.trim();
    
    if (transcription && transcription.length > 0) {
      console.log("[WHISPER] ✓ Transcription successful:", transcription.length, "characters");
      return transcription;
    } else {
      console.log("[WHISPER] Empty transcription");
      return null;
    }
  } catch (error) {
    console.error("[WHISPER] Error during transcription:", (error as Error)?.message || error);
    return null;
  }
}

/**
 * Wrapper for transcription with error handling
 */
export async function getAudioTranscription(
  mediaBuffer: Buffer | undefined
): Promise<{ transcription: string | null; success: boolean }> {
  if (!mediaBuffer) {
    return { transcription: null, success: false };
  }

  try {
    const transcription = await transcribeAudio(mediaBuffer);
    return { transcription, success: true };
  } catch (error) {
    console.error("[WHISPER] Error in getAudioTranscription:", error);
    return { transcription: null, success: false };
  }
}
