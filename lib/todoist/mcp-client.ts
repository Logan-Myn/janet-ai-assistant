import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { config } from '@/config';

let mcpClientInstance: Awaited<ReturnType<typeof createMCPClient>> | null = null;

/**
 * Get or create the Todoist MCP client
 * Connects to the official Todoist MCP server at https://ai.todoist.net/mcp
 */
export async function getTodoistMCPClient() {
  if (mcpClientInstance) {
    return mcpClientInstance;
  }

  // Create MCP client connecting to Todoist's official MCP server
  mcpClientInstance = await createMCPClient({
    name: 'todoist',
    transport: {
      type: 'http',
      url: 'https://ai.todoist.net/mcp',
      headers: {
        'Authorization': `Bearer ${config.todoist.apiToken}`,
        'Content-Type': 'application/json',
      },
    },
  });

  console.log('Connected to Todoist MCP server');

  return mcpClientInstance;
}

/**
 * Get Todoist MCP tools
 * These tools are provided by the Todoist MCP server
 */
export async function getTodoistMCPTools() {
  const client = await getTodoistMCPClient();
  const tools = await client.tools();

  const toolNames = Object.keys(tools);
  console.log(`Loaded ${toolNames.length} tools from Todoist MCP server`);
  console.log('Available tools:', toolNames.join(', '));

  return tools;
}

/**
 * Close the MCP client connection
 */
export async function closeTodoistMCPClient() {
  if (mcpClientInstance) {
    await mcpClientInstance.close();
    mcpClientInstance = null;
    console.log('Closed Todoist MCP client');
  }
}
