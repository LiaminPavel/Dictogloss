import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSpeechMp3(input: string, voice: string): Promise<Buffer> {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith("sk-")) {
    throw new Error("OPENAI_API_KEY is missing or invalid.");
  }

  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input,
    response_format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
