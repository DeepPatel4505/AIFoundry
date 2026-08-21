import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface McpServer {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'connected' | 'disconnected';
  capabilities: string[];
}

@Injectable({
  providedIn: 'root',
})
export class McpService {
  private mcpServers: McpServer[] = [
    {
      id: 'm1',
      name: 'Local Filesystem MCP',
      description: 'Provides safe, sandboxed reading and writing capabilities within specified workspaces.',
      url: 'localhost:8081/mcp/fs',
      status: 'connected',
      capabilities: ['read_file', 'write_file', 'list_directory'],
    },
    {
      id: 'm2',
      name: 'PostgreSQL Database Connector',
      description: 'Translates natural query logic into optimized SQL execution schemas and index analyses.',
      url: 'postgres-mcp-internal.janus.net',
      status: 'connected',
      capabilities: ['query_schema', 'execute_readonly', 'explain_plan'],
    },
    {
      id: 'm3',
      name: 'Web Search Engine API',
      description: 'Allows agent access to live Google Search indices for real-time validation.',
      url: 'google-search.mcp.janus.net',
      status: 'disconnected',
      capabilities: ['web_search', 'extract_article'],
    },
  ];

  getMcpServers(): Observable<McpServer[]> {
    return of(this.mcpServers);
  }
}
