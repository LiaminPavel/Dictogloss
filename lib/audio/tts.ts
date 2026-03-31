import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSpeechMp3(input: string, voice: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice,
    input,
    response_format: "mp3",
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
