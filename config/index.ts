import type { AppConfig } from '@/types';

function getEnvVar(key: string, required: boolean = true): string {
  const value = process.env[key];

  if (!value && required) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || '';
}

// Lazy-loading config to avoid accessing env vars during build time
export const config: AppConfig = {
  get whatsapp() {
    return {
      phoneNumberId: getEnvVar('WHATSAPP_PHONE_NUMBER_ID'),
      businessAccountId: getEnvVar('WHATSAPP_BUSINESS_ACCOUNT_ID'),
      accessToken: getEnvVar('WHATSAPP_ACCESS_TOKEN'),
      webhookVerifyToken: getEnvVar('WHATSAPP_WEBHOOK_VERIFY_TOKEN'),
      appSecret: getEnvVar('WHATSAPP_APP_SECRET'),
    };
  },
  get openai() {
    return {
      apiKey: getEnvVar('OPENAI_API_KEY'),
      whisperModel: getEnvVar('WHISPER_MODEL', false) || 'whisper-1',
      whisperLanguage: getEnvVar('WHISPER_LANGUAGE', false) || 'en',
    };
  },
  get anthropic() {
    return {
      apiKey: getEnvVar('ANTHROPIC_API_KEY'),
      model: getEnvVar('CLAUDE_MODEL', false) || 'claude-haiku-4-5-20251001',
      extendedThinkingEnabled: getEnvVar('EXTENDED_THINKING_ENABLED', false) === 'true',
      defaultThinkingBudget: (getEnvVar('DEFAULT_THINKING_BUDGET', false) || 'medium') as 'low' | 'medium' | 'high' | 'maximum',
    };
  },
  get todoist() {
    return {
      apiToken: getEnvVar('TODOIST_API_TOKEN'),
    };
  },
  get mem0() {
    return {
      apiKey: getEnvVar('MEM0_API_KEY'),
    };
  },
  get twilio() {
    // Twilio is optional - only load if credentials are provided
    const accountSid = getEnvVar('TWILIO_ACCOUNT_SID', false);
    const authToken = getEnvVar('TWILIO_AUTH_TOKEN', false);
    const whatsappNumber = getEnvVar('TWILIO_WHATSAPP_NUMBER', false);

    if (!accountSid || !authToken || !whatsappNumber) {
      return undefined;
    }

    return {
      accountSid,
      authToken,
      whatsappNumber,
    };
  },
  get app() {
    return {
      nodeEnv: getEnvVar('NODE_ENV', false) || 'development',
      baseUrl: getEnvVar('NEXT_PUBLIC_BASE_URL', false) || 'http://localhost:3000',
      whatsappProvider: (getEnvVar('WHATSAPP_PROVIDER', false) || 'twilio') as 'meta' | 'twilio',
      audioConverterUrl: getEnvVar('AUDIO_CONVERTER_URL', false) || 'http://localhost:3001',
    };
  },
};

export default config;
