import { whatsappClient } from '@/lib/whatsapp/client';
import { twilioWhatsAppClient } from '@/lib/whatsapp/twilio-client';
import { transcribeAudio } from '@/lib/whisper/transcribe';
import { claudeClient } from '@/lib/claude/client';
import { mem0Client } from '@/lib/mem0/memory';
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
    const userContext = await mem0Client.getUserContext(message.userId);

    const isTaskRelated = await isTaskManagementRequest(message.content);

    if (isTaskRelated) {
      return await handleTaskManagement(message, userContext);
    } else {
      return await handleGeneralConversation(message, userContext);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return "I'm sorry, I encountered an error. Please try again.";
  }
}

async function isTaskManagementRequest(content: string): Promise<boolean> {
  const taskKeywords = [
    'task',
    'todo',
    'remind',
    'schedule',
    'project',
    'due',
    'complete',
    'finish',
    'priority',
    'urgent',
    'deadline',
    'create',
    'add',
    'update',
    'delete',
    'list',
    'show',
    'what',
  ];

  const contentLower = content.toLowerCase();
  return taskKeywords.some((keyword) => contentLower.includes(keyword));
}

async function handleTaskManagement(
  message: ProcessedMessage,
  context: any
): Promise<string> {
  try {
    // Claude will use MCP tools to query tasks and detect conflicts during Extended Thinking
    const result = await claudeClient.processMessage(
      message.content,
      context,
      [],
      'high' // Use high thinking budget for task management
    );

    // Log tool calls for debugging
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log('Claude used these tools:', result.toolCalls.map(tc => tc.tool).join(', '));
      console.log('Full tool call details:', JSON.stringify(result.toolCalls, null, 2));

      // Record any created tasks in memory (check for various tool names)
      const createTaskCalls = result.toolCalls.filter(tc =>
        tc.tool === 'createTask' ||
        tc.tool === 'add-task' ||
        tc.tool === 'add-tasks' || // Todoist MCP uses plural!
        tc.tool === 'add_task' ||
        tc.tool === 'add_tasks' ||
        (tc.tool.includes('create') && tc.tool.includes('task')) ||
        (tc.tool.includes('add') && tc.tool.includes('task'))
      );

      if (createTaskCalls.length > 0) {
        console.log('Task creation tools called:', createTaskCalls.length);
        for (const call of createTaskCalls) {
          console.log('Task creation result:', JSON.stringify(call.result, null, 2));
          if (call.result?.success && call.result?.task) {
            const task = call.result.task;
            await mem0Client.recordTask(
              message.userId,
              task.id,
              task.content,
              task.projectId
            );
            console.log(`Task created and recorded: ${task.content}`);
          }
        }
      } else {
        console.log('WARNING: No task creation tool was called!');
      }
    } else {
      console.log('WARNING: No tools were called at all!');
    }

    console.log('Claude response:', result.text);
    return result.text;
  } catch (error) {
    console.error('Error in handleTaskManagement:', error);
    return "I'm sorry, I had trouble managing your tasks. Please try rephrasing your request.";
  }
}

async function handleGeneralConversation(
  message: ProcessedMessage,
  context: any
): Promise<string> {
  try {
    const result = await claudeClient.processMessage(
      message.content,
      context,
      [],
      'medium'
    );

    return result.text;
  } catch (error) {
    console.error('Error in handleGeneralConversation:', error);
    return "I'm sorry, I encountered an error. Please try again.";
  }
}
