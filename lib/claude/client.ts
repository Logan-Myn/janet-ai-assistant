import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { config } from '@/config';
import { getTodoistMCPTools, closeTodoistMCPClient } from '@/lib/todoist/mcp-client';
import type { UserContext } from '@/types';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeClient {
  // Lazy-load config values to avoid accessing env vars during build time
  private get model(): string {
    return config.anthropic.model;
  }

  private get extendedThinkingEnabled(): boolean {
    return config.anthropic.extendedThinkingEnabled;
  }

  private get defaultBudget(): 'low' | 'medium' | 'high' | 'maximum' {
    return config.anthropic.defaultThinkingBudget;
  }

  async processMessage(
    userMessage: string,
    context?: UserContext,
    conversationHistory: ClaudeMessage[] = [],
    thinkingBudget?: 'low' | 'medium' | 'high' | 'maximum'
  ): Promise<{ text: string; toolCalls?: any[] }> {
    const systemPrompt = this.buildSystemPrompt(context);
    const budget = thinkingBudget || this.defaultBudget;

    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    try {
      // Get tools from Todoist MCP server
      console.log('Fetching tools from Todoist MCP server...');
      const tools = await getTodoistMCPTools();

      // Allow multiple tool calls with maxSteps (AI SDK 5.0+)
      // @ts-ignore - maxSteps parameter typing not yet in @types
      const result = await generateText({
        model: anthropic(this.model),
        messages,
        system: systemPrompt,
        tools, // MCP tools from Todoist server
        temperature: 0.7,
        maxSteps: 10, // Allow multiple tool calls to complete workflow
      } as any);

      // Close MCP client after use
      await closeTodoistMCPClient();

      return {
        text: result.text,
        toolCalls: result.toolResults?.map((tr: any) => ({
          tool: tr.toolName,
          result: tr.result,
        })),
      };
    } catch (error) {
      console.error('Error processing message with Claude:', error);
      // Close MCP client on error too
      await closeTodoistMCPClient();
      throw new Error('Failed to process message');
    }
  }

  private buildSystemPrompt(context?: UserContext): string {
    let prompt = `You are Janet, an AI productivity assistant that helps users manage their tasks through natural conversation. You integrate with Todoist via MCP (Model Context Protocol).

Your capabilities - Available MCP tools:
- Task Management: add-tasks, update-tasks, complete-tasks, find-tasks, find-tasks-by-date
- Project Management: add-projects, update-projects, find-projects
- Sections: add-sections, update-sections, find-sections
- Comments: add-comments, update-comments, find-comments
- Other: search, user-info, get-overview, find-activity

CRITICAL WORKFLOW RULES:
1. ALWAYS COMPLETE THE FULL ACTION IN ONE RESPONSE
   - If you need to find a project ID, call find-projects AND THEN immediately call add-tasks
   - DO NOT stop after the first tool call - chain multiple calls together
   - DO NOT ask the user to wait or tell them you're "looking up" something

2. Multi-step tasks MUST be completed in a single turn:
   - Example: "Add task to ProjectX" → call find-projects, get ID, call add-tasks with that ID
   - Example: "Update task 123" → call find-tasks, verify it exists, call update-tasks

3. Only respond to the user AFTER completing all necessary tool calls

4. Be brief and action-oriented:
   - "✓ Task added to LatinPassion" (not "Let me find that project first...")
   - Only explain if there's a problem or conflict

Guidelines:
- Complete the full workflow before responding
- Chain tool calls together - don't stop mid-workflow
- Be conversational but efficient
- Never delete or overwrite tasks without confirmation
`;

    if (context) {
      prompt += `\n\nUser Context:`;

      if (context.preferences.workHours) {
        prompt += `\n- Work hours: ${context.preferences.workHours.start} to ${context.preferences.workHours.end}`;
      }

      if (context.preferences.timezone) {
        prompt += `\n- Timezone: ${context.preferences.timezone}`;
      }

      if (context.patterns.averageTaskDuration) {
        prompt += `\n- Average task durations: ${JSON.stringify(context.patterns.averageTaskDuration)}`;
      }

      if (context.recentContext.currentProjects.length > 0) {
        prompt += `\n- Current projects: ${context.recentContext.currentProjects.join(', ')}`;
      }
    }

    return prompt;
  }
}

export const claudeClient = new ClaudeClient();
