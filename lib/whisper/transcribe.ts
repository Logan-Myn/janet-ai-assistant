import OpenAI from 'openai';
import FormData from 'form-data';
import { config } from '@/config';

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openaiInstance;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/ogg'
): Promise<string> {
  try {
    const openai = getOpenAI();
    const fileExtension = getFileExtension(mimeType);
    const fileName = `audio.${fileExtension}`;

    const uint8Array = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8Array], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: config.openai.whisperModel,
      language: config.openai.whisperLanguage || undefined,
      response_format: 'text',
      temperature: 0,
    });

    return transcription as string;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/ogg': 'ogg',
    'audio/opus': 'opus',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/aac': 'aac',
    'audio/amr': 'amr',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
  };

  return mimeToExt[mimeType] || 'ogg';
}

export async function transcribeFromUrl(
  audioUrl: string,
  audioBuffer: Buffer,
  mimeType: string = 'audio/ogg'
): Promise<string> {
  return transcribeAudio(audioBuffer, mimeType);
}
