import OpenAI from 'openai';
import FormData from 'form-data';
import { config } from '@/config';
import { convertOggOpusToWav, needsConversion } from '@/lib/utils/audio-converter';

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

    // Convert OGG/Opus to WAV if needed (Whisper doesn't support Opus codec)
    let processedBuffer = audioBuffer;
    let processedMimeType = mimeType;

    if (needsConversion(mimeType)) {
      console.log(`Converting ${mimeType} (Opus codec) to WAV for Whisper compatibility...`);
      processedBuffer = await convertOggOpusToWav(audioBuffer);
      processedMimeType = 'audio/wav';
      console.log(`Conversion complete - WAV size: ${processedBuffer.length} bytes`);
    }

    const fileExtension = getFileExtension(processedMimeType);
    const fileName = `audio.${fileExtension}`;

    console.log(`Creating audio file - Name: ${fileName}, MimeType: ${processedMimeType}, Size: ${processedBuffer.length} bytes`);

    const uint8Array = new Uint8Array(processedBuffer);
    const blob = new Blob([uint8Array], { type: processedMimeType });
    const file = new File([blob], fileName, { type: processedMimeType });

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
  // Extract base mime type (remove codec info)
  const baseMimeType = mimeType.split(';')[0].trim();

  const mimeToExt: Record<string, string> = {
    'audio/wav': 'wav',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/webm': 'webm',
    'audio/flac': 'flac',
  };

  return mimeToExt[baseMimeType] || 'wav';
}

export async function transcribeFromUrl(
  audioUrl: string,
  audioBuffer: Buffer,
  mimeType: string = 'audio/ogg'
): Promise<string> {
  return transcribeAudio(audioBuffer, mimeType);
}
