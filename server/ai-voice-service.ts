import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";

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

export async function makeCallWithAgent(
  phoneNumber: string,
  agentPrompt: string,
  voiceId: string
) {
  try {
    const call = await twilioClient.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER || "",
      url: `${process.env.APP_URL}/api/voice/twiml`,
      record: true,
      timeout: 60,
    });

    return {
      success: true,
      callSid: call.sid,
      status: call.status,
    };
  } catch (error) {
    console.error("Error making call:", error);
    return {
      success: false,
      error: String(error),
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
