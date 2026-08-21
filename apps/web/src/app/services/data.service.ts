import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  status: 'active' | 'idle' | 'error';
  lastActive: string;
}

export interface McpServer {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'connected' | 'disconnected';
  capabilities: string[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'tool' | 'logic' | 'api';
  usageCount: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private agents: Agent[] = [
    {
      id: '1',
      name: 'CodeCraft Assistant',
      description: 'Autonomous refactoring and code generation agent specialized in Angular & TypeScript.',
      model: 'Gemini 2.0 Flash',
      status: 'active',
      lastActive: 'Just now',
    },
    {
      id: '2',
      name: 'Insight Analytica',
      description: 'Document and dataset analyzer specializing in statistical reports and visualizations.',
      model: 'Gemini 1.5 Pro',
      status: 'idle',
      lastActive: '12m ago',
    },
    {
      id: '3',
      name: 'API Gatekeeper',
      description: 'Security scanner testing endpoints against OWASP standards and simulating stress loads.',
      model: 'Gemini 2.0 Flash',
      status: 'error',
      lastActive: '1h ago',
    },
  ];

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

  private skills: Skill[] = [
    { id: 's1', name: 'TypeScript Transpilation', description: 'Compile and type-check TS files dynamically.', category: 'tool', usageCount: 142 },
    { id: 's2', name: 'Mermaid Diagram Parsing', description: 'Generate visualization graphs from structured schemas.', category: 'logic', usageCount: 89 },
    { id: 's3', name: 'Slack Integration Webhook', description: 'Send system notifications and execution status reports to user channels.', category: 'api', usageCount: 45 },
  ];

  private prompts: PromptTemplate[] = [
    {
      id: 'p1',
      name: 'Refactoring Advisor',
      description: 'Checks inputs for code smells, layout issues, and suggests TypeScript improvements.',
      template: 'Review the following Angular code block. Identify memory leaks, check standalone declarations, and propose modern clean code edits: \n\n{{code}}',
      tags: ['Development', 'Angular', 'Quality'],
    },
    {
      id: 'p2',
      name: 'SQL Schematizer',
      description: 'Generates robust tables from text specifications.',
      template: 'Create a PostgreSQL schema from this requirements summary: "{{requirements}}". Ensure foreign key references are correct and indexes are built for high-performance retrieval.',
      tags: ['Database', 'SQL', 'Structure'],
    },
  ];

  getHomeStats() {
    return of({
      agentsCount: this.agents.length,
      activeAgents: this.agents.filter((a) => a.status === 'active').length,
      serversCount: this.mcpServers.length,
      connectedServers: this.mcpServers.filter((s) => s.status === 'connected').length,
      skillsCount: this.skills.length,
      promptsCount: this.prompts.length,
    });
  }

  getAgents(): Observable<Agent[]> {
    return of(this.agents);
  }

  getMcpServers(): Observable<McpServer[]> {
    return of(this.mcpServers);
  }

  getSkills(): Observable<Skill[]> {
    return of(this.skills);
  }

  getPrompts(): Observable<PromptTemplate[]> {
    return of(this.prompts);
  }
}
