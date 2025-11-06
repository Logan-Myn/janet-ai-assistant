import { whatsappClient } from '@/lib/whatsapp/client';
import { twilioWhatsAppClient } from '@/lib/whatsapp/twilio-client';
import { transcribeAudio } from '@/lib/whisper/transcribe';
import { agentManager } from '@/lib/claude/agent-manager';
import { conversationManager } from '@/lib/utils/conversation-manager';
import { mem0Client } from '@/lib/mem0/memory';
import { mcpManager } from '@/lib/mcp/multi-client';
import { config } from '@/config';
import type { ProcessedMessage } from '@/types';

export async function processIncomingMessage(
  message: any,
  value: any
): Promise<void> {
  try {
    const userId = message.from;
    const userName = value.contacts?.[0]?.profile?.name || 'User';
    const messageId = message.id;
    const provider = config.app.whatsappProvider;

    // Mark as read (only for Meta)
    if (provider === 'meta') {
      await whatsappClient.markAsRead(messageId);
    }

    let messageContent: string;
    let messageType: 'text' | 'voice';

    if (message.type === 'text') {
      messageContent = message.text.body;
      messageType = 'text';
      console.log(`Received text message from ${userName}: ${messageContent}`);
    } else if (message.type === 'audio') {
      console.log(`Received voice message from ${userName}, transcribing...`);

      let audioBuffer: Buffer;
      let mimeType: string;

      if (provider === 'twilio') {
        // Twilio provides direct media URL in message.audio.id
        const mediaUrl = message.audio.id;
        const response = await fetch(mediaUrl);
        audioBuffer = Buffer.from(await response.arrayBuffer());
        mimeType = message.audio.mime_type || 'audio/ogg';
      } else {
        // Meta requires fetching media URL first
        const mediaData = await whatsappClient.getMediaUrl(message.audio.id);
        audioBuffer = await whatsappClient.downloadMedia(mediaData.url);
        mimeType = mediaData.mime_type;
      }

      messageContent = await transcribeAudio(audioBuffer, mimeType);
      messageType = 'voice';

      console.log(`Transcribed: ${messageContent}`);
    } else {
      console.log(`Unsupported message type: ${message.type}`);
      return;
    }

    const processedMessage: ProcessedMessage = {
      userId,
      userName,
      messageId,
      content: messageContent,
      type: messageType,
      timestamp: new Date(),
    };

    const response = await handleMessage(processedMessage);

    // Send response using the appropriate client
    if (provider === 'twilio') {
      await twilioWhatsAppClient.sendTextMessage(userId, response);
    } else {
      await whatsappClient.sendTextMessage(userId, response);
    }

    await mem0Client.recordConversation(userId, messageContent, response);
  } catch (error) {
    console.error('Error in processIncomingMessage:', error);

    try {
      const provider = config.app.whatsappProvider;
      const errorMessage = "I'm sorry, I encountered an error processing your message. Please try again.";

      if (provider === 'twilio') {
        await twilioWhatsAppClient.sendTextMessage(message.from, errorMessage);
      } else {
        await whatsappClient.sendTextMessage(message.from, errorMessage);
      }
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
}

async function handleMessage(message: ProcessedMessage): Promise<string> {
  try {
    // Get Agent instance for this user (creates with context if needed)
    const agent = await agentManager.getAgent(message.userId);

    // Get conversation history
    const history = conversationManager.getHistory(message.userId);

    // Add user message to history
    conversationManager.addMessage(message.userId, 'user', message.content);

    console.log(`Processing message for user ${message.userId} (history: ${history.length} messages)`);

    // Use Agent to process message with full conversation context
    // Agent automatically handles multi-step tool calling
    // Format conversation history into the prompt
    let fullPrompt = message.content;
    if (history.length > 0) {
      const historyContext = history
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
      fullPrompt = `Previous conversation:\n${historyContext}\n\nCurrent message: ${message.content}`;
    }

    const result = await agent.generate({ prompt: fullPrompt });

    // Log tool usage for debugging
    if (result.steps && result.steps.length > 0) {
      const toolsUsed = result.steps
        .flatMap((step: any) => step.toolCalls || [])
        .map((tc: any) => tc.toolName)
        .filter(Boolean);

      if (toolsUsed.length > 0) {
        console.log(`Agent completed ${result.steps.length} steps using tools:`, toolsUsed.join(', '));

        // Record task creation in Mem0
        const createTaskCalls = result.steps
          .flatMap((step: any) => step.toolCalls || [])
          .filter((tc: any) =>
            tc.toolName === 'add-tasks' ||
            tc.toolName === 'add-task' ||
            tc.toolName?.includes('add') && tc.toolName?.includes('task')
          );

        for (const call of createTaskCalls) {
          if (call.result?.success) {
            console.log('Task created via MCP:', call.toolName);
            // Note: Todoist MCP may not return full task details
            // Consider using find-tasks to get created task info if needed
          }
        }
      }
    }

    // Add assistant response to history
    conversationManager.addMessage(message.userId, 'assistant', result.text);

    console.log('Agent response:', result.text);
    return result.text;
  } catch (error) {
    console.error('Error handling message:', error);

    // Close MCP connections on error
    await mcpManager.closeAll();

    return "I'm sorry, I encountered an error processing your message. Please try again.";
  } finally {
    // Clean up MCP connections after processing
    await mcpManager.closeAll();
  }
}

