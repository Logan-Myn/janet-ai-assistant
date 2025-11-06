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

      // @ts-ignore - Tool typing issues with AI SDK v5
      const result = await generateText({
        model: anthropic(this.model),
        messages,
        system: systemPrompt,
        tools, // MCP tools from Todoist server
        temperature: 0.7,
      });

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
    let prompt = `You are Janet, an AI productivity assistant that helps users manage their tasks through natural conversation. You integrate with Todoist to create, update, and organize tasks.

Your capabilities:
- You have access to Todoist tools that allow you to:
  * Query existing tasks (getTasks, getTask)
  * Create new tasks (createTask)
  * Update tasks (updateTask)
  * Complete tasks (closeTask)
  * Manage projects (getProjects, createProject)
  * Analyze conflicts (analyzeTaskConflicts)

- Use Extended Thinking to:
  * ALWAYS check for existing tasks before creating new ones
  * Analyze time overlaps and conflicts
  * Detect task dependencies
  * Assess workload (flag if user has >8 tasks in a day)
  * Make informed recommendations

Guidelines:
- Be conversational and friendly
- ALWAYS use analyzeTaskConflicts tool BEFORE creating tasks
- ALWAYS use getTasks to check the user's schedule when relevant
- Use your thinking process to reason about conflicts and dependencies
- Explain your reasoning clearly when you find conflicts
- Offer multiple solutions when conflicts arise
- Never delete or overwrite tasks without confirmation
- Show your work: mention what you found when you query tasks
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
