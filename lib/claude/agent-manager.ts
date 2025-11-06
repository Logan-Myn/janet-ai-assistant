import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { config } from '@/config';
import { mcpManager } from '@/lib/mcp/multi-client';
import { mem0Client } from '@/lib/mem0/memory';
import type { UserContext } from '@/types';

/**
 * AgentManager - Manages AI SDK Agent instances with caching
 * Creates and caches Agent instances per user for better performance
 */
class AgentManager {
  private agentCache: Map<string, { agent: Agent<any, any, any>; createdAt: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Get or create an Agent instance for a user
   */
  async getAgent(userId: string): Promise<Agent<any, any, any>> {
    // Check if we have a valid cached agent
    const cached = this.agentCache.get(userId);
    if (cached && Date.now() - cached.createdAt < this.CACHE_TTL) {
      console.log(`Using cached agent for user ${userId}`);
      return cached.agent;
    }

    // Create new agent with user context
    console.log(`Creating new agent for user ${userId}`);
    const agent = await this.createAgent(userId);

    // Cache the agent
    this.agentCache.set(userId, {
      agent,
      createdAt: Date.now(),
    });

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.invalidateAgent(userId);
    }, this.CACHE_TTL);

    return agent;
  }

  /**
   * Create a new Agent instance with user context
   */
  private async createAgent(userId: string): Promise<Agent<any, any, any>> {
    // Get user context from Mem0
    const userContext = await mem0Client.getUserContext(userId);

    // Get all MCP tools from connected servers
    const mcpTools = await mcpManager.getAllTools();

    // Build context-aware system prompt
    const systemPrompt = this.buildSystemPrompt(userContext);

    // Create agent with MCP tools
    const agent = new Agent({
      model: anthropic(config.anthropic.model),
      tools: mcpTools,
      system: systemPrompt,
      stopWhen: stepCountIs(20), // Allow up to 20 steps for complex workflows
      temperature: 0.7,
      // Optional: Add prepareStep for advanced control
      // prepareStep: async ({ stepNumber, messages }) => {
      //   if (stepNumber > 10) {
      //     return { messages: messages.slice(-15) };
      //   }
      // },
    } as any); // Type workaround for experimental features

    return agent;
  }

  /**
   * Build system prompt with user context
   */
  private buildSystemPrompt(context: UserContext): string {
    let prompt = `You are Janet, an AI productivity assistant that helps users manage their tasks through natural conversation. You integrate with Todoist via MCP (Model Context Protocol).

Your capabilities - Available MCP tools:
- Task Management: add-tasks, update-tasks, complete-tasks, find-tasks, find-tasks-by-date, find-completed-tasks
- Project Management: add-projects, update-projects, find-projects
- Sections: add-sections, update-sections, find-sections
- Comments: add-comments, update-comments, find-comments
- Other: search, user-info, get-overview, find-activity, delete-object, find-project-collaborators, manage-assignments, fetch

CRITICAL WORKFLOW RULES:
1. ALWAYS COMPLETE THE FULL ACTION IN ONE RESPONSE
   - The Agent loop allows you to chain multiple tool calls
   - If you need to find a project ID, call find-projects AND THEN immediately call add-tasks
   - DO NOT stop after the first tool call - the loop continues automatically
   - Example: "Add task to ProjectX" → call find-projects → call add-tasks with that ID

2. Only respond to the user AFTER completing all necessary tool calls

3. Be brief and action-oriented:
   - "✓ Task added to LatinPassion" (not "Let me find that project first...")
   - Only explain if there's a problem or conflict

4. Guidelines:
   - Complete the full workflow before responding
   - Chain tool calls together naturally
   - Be conversational but efficient
   - Never delete or overwrite tasks without confirmation
`;

    // Add user-specific context from Mem0
    if (context && Object.keys(context.preferences).length > 0) {
      prompt += '\n\nUser Context (from memory):';

      if (context.preferences.workHours) {
        prompt += `\n- Work hours: ${context.preferences.workHours.start} to ${context.preferences.workHours.end}`;
      }

      if (context.preferences.timezone) {
        prompt += `\n- Timezone: ${context.preferences.timezone}`;
      }

      if (context.preferences.commonProjects && context.preferences.commonProjects.length > 0) {
        prompt += `\n- Frequently used projects: ${context.preferences.commonProjects.join(', ')}`;
      }

      if (context.patterns.averageTaskDuration) {
        prompt += `\n- Typical task durations: ${JSON.stringify(context.patterns.averageTaskDuration)}`;
      }

      if (context.recentContext.currentProjects.length > 0) {
        prompt += `\n- Current active projects: ${context.recentContext.currentProjects.slice(0, 5).join(', ')}`;
      }

      if (context.recentContext.lastTasks.length > 0) {
        prompt += `\n- Recent tasks: ${context.recentContext.lastTasks.slice(0, 3).join(', ')}`;
      }
    }

    return prompt;
  }

  /**
   * Invalidate (remove) an agent from cache
   * Use this when user context changes significantly
   */
  invalidateAgent(userId: string): void {
    if (this.agentCache.has(userId)) {
      this.agentCache.delete(userId);
      console.log(`Invalidated agent cache for user ${userId}`);
    }
  }

  /**
   * Clear all cached agents
   */
  clearAllAgents(): void {
    this.agentCache.clear();
    console.log('Cleared all agent caches');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; users: string[] } {
    return {
      total: this.agentCache.size,
      users: Array.from(this.agentCache.keys()),
    };
  }
}

// Export singleton instance
export const agentManager = new AgentManager();
