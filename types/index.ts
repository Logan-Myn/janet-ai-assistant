// WhatsApp Types
export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'audio';
  text?: {
    body: string;
  };
  audio?: {
    id: string;
  };
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: 'whatsapp';
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: 'text' | 'audio' | 'image' | 'video' | 'document';
        text?: {
          body: string;
        };
        audio?: {
          mime_type: string;
          sha256: string;
          id: string;
          voice: boolean;
        };
      }>;
      statuses?: Array<{
        id: string;
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
}

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppWebhookEntry[];
}

export interface WhatsAppMediaResponse {
  messaging_product: 'whatsapp';
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
}

// Todoist Types
export interface TodoistTask {
  id: string;
  project_id: string;
  content: string;
  description: string;
  is_completed: boolean;
  labels: string[];
  priority: 1 | 2 | 3 | 4; // 1 = normal, 4 = urgent
  due?: {
    date: string;
    string: string;
    datetime?: string;
    timezone?: string;
  };
  order: number;
  created_at: string;
  parent_id?: string;
}

export interface TodoistProject {
  id: string;
  name: string;
  color: string;
  is_favorite: boolean;
  order: number;
  comment_count: number;
}

export interface TaskConflict {
  type: 'time_overlap' | 'dependency' | 'workload' | 'deadline';
  severity: 'low' | 'medium' | 'high';
  message: string;
  conflictingTasks: TodoistTask[];
  suggestions: string[];
}

// Memory Types (Mem0)
export interface UserContext {
  userId: string;
  preferences: {
    workHours?: {
      start: string;
      end: string;
    };
    timezone?: string;
    preferredPriority?: 1 | 2 | 3 | 4;
    commonProjects?: string[];
  };
  patterns: {
    averageTaskDuration?: Record<string, number>; // task type -> minutes
    productiveHours?: string[];
    completionRate?: number;
  };
  recentContext: {
    lastTasks: string[];
    currentProjects: string[];
    recentTopics: string[];
  };
}

export interface MemoryEntry {
  id: string;
  userId: string;
  content: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

// Claude AI Types
export interface ClaudeConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  extendedThinking: {
    enabled: boolean;
    budget: 'low' | 'medium' | 'high' | 'maximum';
  };
}

export interface ExtendedThinkingResponse {
  type: 'thinking' | 'response';
  content: string;
  thinkingTokens?: number;
  responseTokens?: number;
}

export interface TaskAnalysis {
  conflicts: TaskConflict[];
  suggestions: string[];
  reasoning: string;
  confidence: number;
}

// Application Types
export interface ProcessedMessage {
  userId: string;
  userName: string;
  messageId: string;
  content: string;
  type: 'text' | 'voice';
  timestamp: Date;
  context?: UserContext;
}

export interface BotResponse {
  message: string;
  tasksCreated?: TodoistTask[];
  tasksUpdated?: TodoistTask[];
  conflicts?: TaskConflict[];
  suggestions?: string[];
}

// Configuration Types
export interface AppConfig {
  whatsapp: {
    phoneNumberId: string;
    businessAccountId: string;
    accessToken: string;
    webhookVerifyToken: string;
    appSecret: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    whatsappNumber: string;
  };
  openai: {
    apiKey: string;
    whisperModel: string;
    whisperLanguage?: string;
  };
  anthropic: {
    apiKey: string;
    model: string;
    extendedThinkingEnabled: boolean;
    defaultThinkingBudget: 'low' | 'medium' | 'high' | 'maximum';
  };
  todoist: {
    apiToken: string;
  };
  mem0: {
    apiKey: string;
  };
  app: {
    nodeEnv: string;
    baseUrl: string;
    whatsappProvider: 'meta' | 'twilio';
    audioConverterUrl: string;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// Webhook Response Types
export interface WebhookVerification {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}
