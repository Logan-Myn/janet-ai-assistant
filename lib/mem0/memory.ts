import { MemoryClient } from 'mem0ai';
import { config } from '@/config';
import type { UserContext, MemoryEntry } from '@/types';

export class Mem0Client {
  private _client?: MemoryClient;

  private get client(): MemoryClient {
    if (!this._client) {
      this._client = new MemoryClient({
        apiKey: config.mem0.apiKey,
      });
    }
    return this._client;
  }

  async addMemory(
    userId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.client.add(
        [{ role: 'user', content }],
        {
          user_id: userId,
          metadata,
        }
      );
    } catch (error) {
      console.error('Error adding memory:', error);
      throw new Error('Failed to add memory');
    }
  }

  async searchMemories(
    userId: string,
    query: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const results = await this.client.search(
        query,
        {
          user_id: userId,
          limit,
        }
      );

      return results || [];
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }

  async getAllMemories(userId: string): Promise<any[]> {
    try {
      const memories = await this.client.getAll({
        user_id: userId,
      });

      return memories || [];
    } catch (error) {
      console.error('Error getting all memories:', error);
      return [];
    }
  }

  async getUserContext(userId: string): Promise<UserContext> {
    try {
      const memories = await this.getAllMemories(userId);

      const context: UserContext = {
        userId,
        preferences: {
          commonProjects: [],
        },
        patterns: {},
        recentContext: {
          lastTasks: [],
          currentProjects: [],
          recentTopics: [],
        },
      };

      for (const memory of memories) {
        if (memory.metadata) {
          if (memory.metadata.type === 'preference') {
            Object.assign(context.preferences, memory.metadata.data);
          } else if (memory.metadata.type === 'pattern') {
            Object.assign(context.patterns, memory.metadata.data);
          } else if (memory.metadata.type === 'recent_task') {
            context.recentContext.lastTasks.push(memory.metadata.taskId);
          } else if (memory.metadata.type === 'project') {
            context.recentContext.currentProjects.push(memory.metadata.projectId);
          }
        }
      }

      return context;
    } catch (error) {
      console.error('Error getting user context:', error);
      return {
        userId,
        preferences: {},
        patterns: {},
        recentContext: {
          lastTasks: [],
          currentProjects: [],
          recentTopics: [],
        },
      };
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserContext['preferences']>
  ): Promise<void> {
    try {
      const content = `User preferences: ${JSON.stringify(preferences)}`;
      await this.addMemory(userId, content, {
        type: 'preference',
        data: preferences,
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  async recordTaskPattern(
    userId: string,
    taskType: string,
    duration: number
  ): Promise<void> {
    try {
      const content = `Task "${taskType}" took ${duration} minutes to complete`;
      await this.addMemory(userId, content, {
        type: 'pattern',
        data: {
          taskType,
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error recording task pattern:', error);
    }
  }

  async recordTask(
    userId: string,
    taskId: string,
    taskContent: string,
    projectId?: string
  ): Promise<void> {
    try {
      const content = `Created task: ${taskContent}`;
      const metadata: Record<string, any> = {
        type: 'recent_task',
        taskId,
        taskContent,
      };

      if (projectId) {
        metadata.projectId = projectId;
      }

      await this.addMemory(userId, content, metadata);
    } catch (error) {
      console.error('Error recording task:', error);
    }
  }

  async recordProject(
    userId: string,
    projectId: string,
    projectName: string
  ): Promise<void> {
    try {
      const content = `Working on project: ${projectName}`;
      await this.addMemory(userId, content, {
        type: 'project',
        projectId,
        projectName,
      });
    } catch (error) {
      console.error('Error recording project:', error);
    }
  }

  async recordConversation(
    userId: string,
    userMessage: string,
    assistantResponse: string
  ): Promise<void> {
    try {
      await this.client.add(
        [
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantResponse },
        ],
        {
          user_id: userId,
          metadata: {
            type: 'conversation',
            timestamp: new Date().toISOString(),
          },
        }
      );
    } catch (error) {
      console.error('Error recording conversation:', error);
    }
  }

  async deleteMemory(memoryId: string): Promise<void> {
    try {
      await this.client.delete(memoryId);
    } catch (error) {
      console.error('Error deleting memory:', error);
      throw new Error('Failed to delete memory');
    }
  }

  async deleteAllUserMemories(userId: string): Promise<void> {
    try {
      await this.client.deleteAll({
        user_id: userId,
      });
    } catch (error) {
      console.error('Error deleting all user memories:', error);
      throw new Error('Failed to delete user memories');
    }
  }
}

export const mem0Client = new Mem0Client();
