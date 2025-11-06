import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { config } from '@/config';

type MCPServerName = 'todoist' | 'mem0';

type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;

/**
 * MCPClientManager - Manages multiple MCP server connections
 * Supports Todoist and future MCP servers (Mem0, Calendar, etc.)
 */
class MCPClientManager {
  private clients: Map<MCPServerName, MCPClient> = new Map();

  /**
   * Get or create an MCP client for a specific server
   */
  async getClient(serverName: MCPServerName): Promise<MCPClient> {
    if (this.clients.has(serverName)) {
      return this.clients.get(serverName)!;
    }

    const client = await this.createClient(serverName);
    this.clients.set(serverName, client);
    console.log(`Connected to ${serverName} MCP server`);

    return client;
  }

  /**
   * Create a new MCP client based on server configuration
   */
  private async createClient(serverName: MCPServerName): Promise<MCPClient> {
    const configs: Record<MCPServerName, Parameters<typeof createMCPClient>[0]> = {
      todoist: {
        name: 'todoist',
        transport: {
          type: 'http',
          url: 'https://ai.todoist.net/mcp',
          headers: {
            'Authorization': `Bearer ${config.todoist.apiToken}`,
            'Content-Type': 'application/json',
          },
        },
      },
      mem0: {
        // Placeholder for future Mem0 MCP integration
        // Currently Mem0 is used via API, not MCP
        name: 'mem0',
        transport: {
          type: 'http',
          url: 'http://localhost:8765/mcp/sse',
          headers: {},
        },
      },
    };

    if (!configs[serverName]) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    return await createMCPClient(configs[serverName]);
  }

  /**
   * Get all tools from all connected MCP servers
   * Combines tools from multiple servers into a single tools object
   */
  async getAllTools(): Promise<Record<string, any>> {
    // Currently only Todoist is active
    // TODO: Add Mem0 MCP server when available
    const todoistClient = await this.getClient('todoist');
    const todoistTools = await todoistClient.tools();

    const toolNames = Object.keys(todoistTools);
    console.log(`Loaded ${toolNames.length} tools from MCP servers`);
    console.log('Available tools:', toolNames.join(', '));

    // Future: Combine tools from multiple servers
    // const mem0Client = await this.getClient('mem0');
    // const mem0Tools = await mem0Client.tools();
    // return { ...todoistTools, ...mem0Tools };

    return todoistTools;
  }

  /**
   * Get tools from a specific server
   */
  async getToolsFromServer(serverName: MCPServerName): Promise<Record<string, any>> {
    const client = await this.getClient(serverName);
    return await client.tools();
  }

  /**
   * Close all MCP client connections
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.clients.entries()).map(async ([name, client]) => {
      await client.close();
      console.log(`Closed ${name} MCP client`);
    });

    await Promise.all(closePromises);
    this.clients.clear();
  }

  /**
   * Close a specific MCP client
   */
  async closeClient(serverName: MCPServerName): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.close();
      this.clients.delete(serverName);
      console.log(`Closed ${serverName} MCP client`);
    }
  }

  /**
   * Check if a client is connected
   */
  isConnected(serverName: MCPServerName): boolean {
    return this.clients.has(serverName);
  }
}

// Export singleton instance
export const mcpManager = new MCPClientManager();
