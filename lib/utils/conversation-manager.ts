export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * ConversationManager - Manages conversation history per user
 * Keeps track of recent messages for context in multi-turn conversations
 */
class ConversationManager {
  private conversations: Map<string, ConversationMessage[]> = new Map();
  private readonly MAX_MESSAGES = 20; // Keep last 20 messages (10 exchanges)

  /**
   * Add a message to user's conversation history
   */
  addMessage(userId: string, role: 'user' | 'assistant', content: string): void {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }

    const history = this.conversations.get(userId)!;
    history.push({ role, content });

    // Keep only recent messages to avoid context overflow
    if (history.length > this.MAX_MESSAGES) {
      this.conversations.set(userId, history.slice(-this.MAX_MESSAGES));
    }
  }

  /**
   * Get conversation history for a user
   */
  getHistory(userId: string): ConversationMessage[] {
    return this.conversations.get(userId) || [];
  }

  /**
   * Clear conversation history for a user
   */
  clearHistory(userId: string): void {
    this.conversations.delete(userId);
  }

  /**
   * Get the last N messages for a user
   */
  getRecentMessages(userId: string, count: number): ConversationMessage[] {
    const history = this.getHistory(userId);
    return history.slice(-count);
  }

  /**
   * Check if user has conversation history
   */
  hasHistory(userId: string): boolean {
    const history = this.conversations.get(userId);
    return history !== undefined && history.length > 0;
  }

  /**
   * Get conversation count for a user
   */
  getMessageCount(userId: string): number {
    return this.getHistory(userId).length;
  }

  /**
   * Clear all conversations (cleanup utility)
   */
  clearAll(): void {
    this.conversations.clear();
  }

  /**
   * Get all active user IDs with conversations
   */
  getActiveUsers(): string[] {
    return Array.from(this.conversations.keys());
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();
