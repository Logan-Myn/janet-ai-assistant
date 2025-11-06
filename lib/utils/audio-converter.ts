import { config } from '@/config';

/**
 * Convert OGG/Opus audio buffer to WAV format for OpenAI Whisper
 *
 * Whisper doesn't support Opus codec, so we use an external microservice:
 * - Input: OGG container with Opus codec (from Twilio WhatsApp)
 * - Output: WAV format (PCM, 16kHz, 16-bit)
 *
 * The conversion service runs on VPS with FFmpeg installed
 */
export async function convertOggOpusToWav(
  audioBuffer: Buffer
): Promise<Buffer> {
  try {
    const converterUrl = config.app.audioConverterUrl;
    console.log(`Sending audio to converter service: ${converterUrl}/convert (${audioBuffer.length} bytes)`);

    // Create FormData with audio buffer
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });
    formData.append('audio', blob, 'audio.ogg');

    // Send to conversion service
    const response = await fetch(`${converterUrl}/convert`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Converter service error (${response.status}): ${errorText}`);
    }

    // Get converted WAV buffer
    const wavBuffer = Buffer.from(await response.arrayBuffer());
    const conversionTime = response.headers.get('X-Conversion-Time-Ms');

    console.log(`Audio converted successfully: ${wavBuffer.length} bytes (took ${conversionTime}ms)`);

    return wavBuffer;
  } catch (error) {
    console.error('Audio conversion error:', error);
    throw new Error(`Failed to convert audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if audio buffer needs conversion based on mime type
 */
export function needsConversion(mimeType: string): boolean {
  const baseMimeType = mimeType.split(';')[0].trim().toLowerCase();

  // OGG files from WhatsApp/Twilio need conversion (Opus codec)
  return baseMimeType === 'audio/ogg' || baseMimeType === 'audio/opus';
}
