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

    // Determine the mime type to use for the File object
    // For OGG/Opus from Twilio, use 'audio/ogg' but with .oga extension
    let fileMimeType = mimeType;
    if (fileExtension === 'oga') {
      fileMimeType = 'audio/ogg';
    }

    console.log(`Creating audio file - Name: ${fileName}, MimeType: ${fileMimeType}, Size: ${audioBuffer.length} bytes`);

    const uint8Array = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8Array], { type: fileMimeType });
    const file = new File([blob], fileName, { type: fileMimeType });

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
  // Extract base mime type (remove codec info like "audio/ogg; codecs=opus")
  const baseMimeType = mimeType.split(';')[0].trim();

  const mimeToExt: Record<string, string> = {
    'audio/ogg': 'oga', // Use .oga for OGG audio (Opus codec)
    'audio/opus': 'oga', // Opus codec should use .oga extension for Whisper
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/aac': 'aac',
    'audio/amr': 'amr',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/x-m4a': 'm4a',
  };

  return mimeToExt[baseMimeType] || 'oga';
}

export async function transcribeFromUrl(
  audioUrl: string,
  audioBuffer: Buffer,
  mimeType: string = 'audio/ogg'
): Promise<string> {
  return transcribeAudio(audioBuffer, mimeType);
}
