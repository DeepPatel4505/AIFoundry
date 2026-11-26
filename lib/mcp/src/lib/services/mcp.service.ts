import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';

export interface McpToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
}

export interface McpTool {
  name: string;
  description: string;
  parameters?: McpToolParameter[];
  inputSchema?: Record<string, any>;
  returns?: string;
  example?: Record<string, any>;
}

export interface McpServer {
  id: string;
  name: string;
  slug?: string;
  description: string;
  url: string;
  status: 'connected' | 'disconnected';
  authType: string;
  transport?: 'STREAMABLE_HTTP' | 'SSE' | 'STDIO';
  tags: string[];
  isPublic: boolean;
  capabilities: string[];
  tools?: McpTool[];
  version?: string;
  protocolVersion?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  createdAt?: string;
  stars?: number;
}

export interface ConnectMcpPayload {
  endpointUrl: string;
  transport: 'STREAMABLE_HTTP' | 'SSE';
  authType: 'NONE' | 'BEARER';
  credentials?: {
    token?: string;
  };
}

export interface RegisterMcpPayload extends ConnectMcpPayload {
  name: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  tags?: string[];
  documentationUrl?: string;
  repositoryUrl?: string;
}

export interface DiscoveredMcpPreview {
  serverInfo: {
    name: string;
    version: string;
  };
  protocolVersion: string;
  capabilities: Record<string, any>;
  tools: any[];
  resources: any[];
  prompts: any[];
}

@Injectable({
  providedIn: 'root',
})
export class McpService {
  private http = inject(HttpClient, { optional: true });
  private apiUrl = 'http://localhost:3000/api/v1/mcp-servers';

  private initialServers: McpServer[] = [
    {
      id: 'm1',
      name: 'Local Filesystem MCP',
      slug: 'local-filesystem-mcp',
      description: 'Provides safe, sandboxed reading and writing capabilities within specified workspaces and projects.',
      url: 'http://localhost:8081/mcp/fs',
      status: 'connected',
      authType: 'None',
      transport: 'STREAMABLE_HTTP',
      version: '1.4.2',
      protocolVersion: '2025-06-18',
      repositoryUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
      documentationUrl: 'https://modelcontextprotocol.io/docs/concepts/tools',
      tags: ['System', 'File IO', 'Sandbox'],
      isPublic: true,
      capabilities: ['read_file', 'write_file', 'list_directory'],
      tools: [
        {
          name: 'read_file',
          description: 'Read the complete UTF-8 contents of a file within allowed sandboxed workspace directories.',
          returns: 'string (file contents)',
          parameters: [
            {
              name: 'path',
              type: 'string',
              description: 'Relative path to the target file from workspace root, or absolute path inside allowed bounds.',
              required: true,
            },
            {
              name: 'encoding',
              type: 'string',
              description: 'Character encoding format to read with (e.g. utf-8, ascii).',
              required: false,
              default: 'utf-8',
            },
          ],
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Relative path to target file' },
              encoding: { type: 'string', default: 'utf-8', enum: ['utf-8', 'ascii', 'base64'] },
            },
            required: ['path'],
          },
          example: {
            path: 'src/config/runtime.json',
            encoding: 'utf-8',
          },
        },
        {
          name: 'write_file',
          description: 'Create a new file or atomically overwrite an existing file with the provided text content.',
          returns: 'boolean (success status)',
          parameters: [
            {
              name: 'path',
              type: 'string',
              description: 'Destination file path relative to sandbox directory.',
              required: true,
            },
            {
              name: 'content',
              type: 'string',
              description: 'Full text content payload to commit to disk.',
              required: true,
            },
            {
              name: 'overwrite',
              type: 'boolean',
              description: 'Explicit permission flag to replace existing file content.',
              required: false,
              default: true,
            },
          ],
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Destination file path' },
              content: { type: 'string', description: 'Full file content' },
              overwrite: { type: 'boolean', default: true },
            },
            required: ['path', 'content'],
          },
          example: {
            path: 'scratch/notes.md',
            content: '# Project Analysis Notes\n- Verified MCP tool specifications',
            overwrite: true,
          },
        },
        {
          name: 'list_directory',
          description: 'Enumerate directories and files with file sizes, modification timestamps, and permissions.',
          returns: 'Array<{ name: string, isDirectory: boolean, sizeBytes: number }>',
          parameters: [
            {
              name: 'path',
              type: 'string',
              description: 'Directory path to scan and inspect.',
              required: true,
            },
            {
              name: 'recursive',
              type: 'boolean',
              description: 'Whether to recursively traverse nested folders up to depth limit.',
              required: false,
              default: false,
            },
          ],
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Directory path to scan' },
              recursive: { type: 'boolean', default: false },
            },
            required: ['path'],
          },
          example: {
            path: 'lib/mcp',
            recursive: false,
          },
        },
      ],
    },
    {
      id: 'm2',
      name: 'PostgreSQL Database Connector',
      slug: 'postgres-database-connector',
      description: 'Translates natural query logic into optimized SQL execution schemas and index analyses.',
      url: 'https://postgres-mcp-internal.janus.net/v1/mcp',
      status: 'connected',
      authType: 'Bearer Token',
      transport: 'STREAMABLE_HTTP',
      version: '2.1.0',
      protocolVersion: '2025-06-18',
      repositoryUrl: 'https://github.com/janus-ai/mcp-postgres',
      documentationUrl: 'https://docs.janus.dev/connectors/postgres',
      tags: ['Database', 'SQL', 'PostgreSQL'],
      isPublic: true,
      capabilities: ['query_schema', 'execute_readonly', 'explain_plan'],
      tools: [
        {
          name: 'query_schema',
          description: 'Introspect database schemas, returning tables, columns, indexes, data types, and foreign key relations.',
          returns: 'Array<TableDefinition>',
          parameters: [
            {
              name: 'schema',
              type: 'string',
              description: 'Database schema namespace to introspect.',
              required: false,
              default: 'public',
            },
            {
              name: 'includeIndexes',
              type: 'boolean',
              description: 'Include index definitions and uniqueness constraints.',
              required: false,
              default: true,
            },
          ],
          inputSchema: {
            type: 'object',
            properties: {
              schema: { type: 'string', default: 'public' },
              includeIndexes: { type: 'boolean', default: true },
            },
          },
          example: {
            schema: 'public',
            includeIndexes: true,
          },
        },
        {
          name: 'execute_readonly',
          description: 'Execute a read-only SELECT query against the connected database with strict query timeout guards.',
          returns: 'Array<Record<string, any>>',
          parameters: [
            {
              name: 'query',
              type: 'string',
              description: 'Strict SELECT query statement.',
              required: true,
            },
            {
              name: 'timeoutMs',
              type: 'number',
              description: 'Maximum query execution time in milliseconds before cancellation.',
              required: false,
              default: 5000,
            },
          ],
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'SQL SELECT query' },
              timeoutMs: { type: 'number', default: 5000 },
            },
            required: ['query'],
          },
          example: {
            query: 'SELECT id, username, email, created_at FROM users WHERE status = \'ACTIVE\' LIMIT 10;',
            timeoutMs: 5000,
          },
        },
        {
          name: 'explain_plan',
          description: 'Run EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) on queries to measure planner cost and execution bottlenecks.',
          returns: 'QueryExecutionPlan',
          parameters: [
            {
              name: 'query',
              type: 'string',
              description: 'Target query to analyze.',
              required: true,
            },
            {
              name: 'analyze',
              type: 'boolean',
              description: 'Execute statement to gather actual timing and buffer statistics.',
              required: false,
              default: true,
            },
          ],
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Target SQL statement' },
              analyze: { type: 'boolean', default: true },
            },
            required: ['query'],
          },
          example: {
            query: 'SELECT * FROM audit_logs WHERE user_id = \'e8a4...\' ORDER BY created_at DESC LIMIT 50',
            analyze: true,
          },
        },
      ],
    },
    {
      id: 'm3',
      name: 'Web Search Engine API',
      slug: 'web-search-engine-api',
      description: 'Allows agent access to live Google Search indices for real-time validation and source retrieval.',
      url: 'https://google-search.mcp.janus.net/sse',
      status: 'connected',
      authType: 'Bearer Token',
      transport: 'SSE',
      version: '1.0.8',
      protocolVersion: '2025-06-18',
      documentationUrl: 'https://docs.janus.dev/connectors/web-search',
      tags: ['Web Search', 'API', 'Live Data'],
      isPublic: false,
      capabilities: ['web_search', 'extract_article'],
      tools: [
        {
          name: 'web_search',
          description: 'Search the live web for authoritative answers, recent documentation, and references.',
          returns: 'Array<{ title: string, url: string, snippet: string, publishedDate?: string }>',
          parameters: [
            {
              name: 'query',
              type: 'string',
              description: 'Search keywords or natural query phrases.',
              required: true,
            },
            {
              name: 'numResults',
              type: 'number',
              description: 'Maximum number of ranked result snippets to fetch (1-20).',
              required: false,
              default: 5,
            },
          ],
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Keywords or query' },
              numResults: { type: 'number', default: 5, minimum: 1, maximum: 20 },
            },
            required: ['query'],
          },
          example: {
            query: 'Model Context Protocol TypeScript SDK guide',
            numResults: 5,
          },
        },
        {
          name: 'extract_article',
          description: 'Fetch and parse the readable text, headers, and markdown structure of any valid web page URL.',
          returns: '{ title: string, markdownContent: string, author?: string }',
          parameters: [
            {
              name: 'url',
              type: 'string',
              description: 'Public HTTP/HTTPS URL of the target web page.',
              required: true,
            },
          ],
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Target HTTP/HTTPS web URL' },
            },
            required: ['url'],
          },
          example: {
            url: 'https://modelcontextprotocol.io/docs/concepts/architecture',
          },
        },
      ],
    },
  ];

  // Observables required by the MVP architecture
  private serversSubject = new BehaviorSubject<McpServer[]>(this.initialServers);
  servers$ = this.serversSubject.asObservable();

  loading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  connectionPreview$ = new BehaviorSubject<DiscoveredMcpPreview | null>(null);

  // Filter and Pagination States
  private searchSubject = new BehaviorSubject<string>('');
  private visibilitySubject = new BehaviorSubject<string>('All');
  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(9);

  filteredServers$: Observable<McpServer[]> = combineLatest([
    this.servers$,
    this.searchSubject,
    this.visibilitySubject,
  ]).pipe(
    map(([servers, search, visibility]) => {
      let filtered = [...servers];

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      // Visibility Filter
      if (visibility !== 'All') {
        const isPublic = visibility === 'Public';
        filtered = filtered.filter((s) => s.isPublic === isPublic);
      }

      return filtered;
    })
  );

  paginationMetadata$: Observable<{ page: number; limit: number; total: number; totalPages: number }> = combineLatest([
    this.filteredServers$,
    this.pageSubject,
    this.limitSubject,
  ]).pipe(
    map(([filtered, page, limit]) => {
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const activePage = page > totalPages ? totalPages : page;
      return {
        page: activePage,
        limit,
        total,
        totalPages,
      };
    })
  );

  paginatedServers$: Observable<McpServer[]> = combineLatest([
    this.filteredServers$,
    this.pageSubject,
    this.limitSubject,
  ]).pipe(
    map(([filtered, page, limit]) => {
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const activePage = page > totalPages ? totalPages : page;
      const start = (activePage - 1) * limit;
      return filtered.slice(start, start + limit);
    })
  );

  constructor() {
    this.refreshServers();
  }

  /**
   * Refreshes server list from backend API with graceful fallback to initial servers
   */
  refreshServers(): void {
    if (!this.http) return;

    this.loading$.next(true);
    this.http
      .get<{ success: boolean; data: any[] }>(this.apiUrl)
      .pipe(
        catchError(() => of(null)),
        tap(() => this.loading$.next(false))
      )
      .subscribe((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          // Merge API servers with initial servers without duplicates
          const apiServers: McpServer[] = res.data.map((item) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            description: item.description || '',
            url: item.endpointUrl || item.url || '',
            status: item.status || 'connected',
            authType: item.authType || 'None',
            transport: item.transport || 'STREAMABLE_HTTP',
            tags: item.tags || [],
            isPublic: item.visibility === 'PUBLIC' || item.isPublic,
            capabilities: item.capabilities || [],
            tools: item.tools || [],
            version: item.version || '1.0.0',
            protocolVersion: item.protocolVersion || '2025-06-18',
            createdAt: item.createdAt,
          }));

          const existingIds = new Set(apiServers.map((s) => s.id));
          const preservedInitials = this.initialServers.filter((s) => !existingIds.has(s.id));
          this.serversSubject.next([...apiServers, ...preservedInitials]);
        }
      });
  }

  /**
   * Connect to an MCP server through the backend to discover metadata without persisting.
   */
  connectMcpServer(payload: ConnectMcpPayload): Observable<DiscoveredMcpPreview> {
    this.loading$.next(true);
    this.error$.next(null);

    if (!this.http) {
      // Mock fallback if HttpClient is not injected
      const mockResult: DiscoveredMcpPreview = {
        serverInfo: { name: 'mcp-server', version: '1.0.0' },
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        tools: [
          {
            name: 'status_check',
            description: 'Check status and health metrics',
            parameters: [{ name: 'verbose', type: 'boolean', description: 'Enable verbose diagnostics', required: false }],
          },
        ],
        resources: [],
        prompts: [],
      };
      this.connectionPreview$.next(mockResult);
      this.loading$.next(false);
      return of(mockResult);
    }

    return this.http
      .post<{ success: boolean; data: DiscoveredMcpPreview }>(`${this.apiUrl}/connect`, payload)
      .pipe(
        map((res) => {
          this.loading$.next(false);
          this.connectionPreview$.next(res.data);
          return res.data;
        }),
        catchError((err) => {
          this.loading$.next(false);
          const errorMsg = err.error?.error?.message || err.message || 'Connection failed';
          this.error$.next(errorMsg);
          throw err;
        })
      );
  }

  /**
   * Register MCP server in backend PostgreSQL.
   */
  registerMcpServer(payload: RegisterMcpPayload): Observable<any> {
    this.loading$.next(true);
    this.error$.next(null);

    if (!this.http) {
      const added: McpServer = {
        id: 'm' + (this.serversSubject.value.length + 1).toString(),
        name: payload.name,
        description: payload.description || '',
        url: payload.endpointUrl,
        status: 'connected',
        authType: payload.authType === 'BEARER' ? 'Bearer Token' : 'None',
        transport: payload.transport,
        tags: payload.tags && payload.tags.length > 0 ? payload.tags : ['General'],
        isPublic: payload.visibility === 'PUBLIC',
        capabilities: ['initialize', 'tools/list'],
        tools: [
          {
            name: 'health_check',
            description: 'Connectivity check',
            parameters: [],
          },
        ],
      };
      this.serversSubject.next([added, ...this.serversSubject.value]);
      this.loading$.next(false);
      return of({ success: true, data: added });
    }

    return this.http
      .post<{ success: boolean; data: any }>(this.apiUrl, payload)
      .pipe(
        tap((res) => {
          this.loading$.next(false);
          this.refreshServers();
        }),
        catchError((err) => {
          this.loading$.next(false);
          const errorMsg = err.error?.error?.message || err.message || 'Registration failed';
          this.error$.next(errorMsg);
          throw err;
        })
      );
  }

  setSearch(q: string): void {
    this.searchSubject.next(q);
    this.pageSubject.next(1);
  }

  setVisibility(visibility: string): void {
    this.visibilitySubject.next(visibility);
    this.pageSubject.next(1);
  }

  setPage(page: number): void {
    this.pageSubject.next(page);
  }

  setLimit(limit: number): void {
    this.limitSubject.next(limit);
    this.pageSubject.next(1);
  }

  addMcpServer(newServer: Omit<McpServer, 'id' | 'status' | 'capabilities'>): void {
    const current = this.serversSubject.value;
    const added: McpServer = {
      ...newServer,
      id: 'm' + (current.length + 1).toString(),
      status: 'connected',
      capabilities: ['initialize', 'tools/list'],
    };
    this.serversSubject.next([added, ...current]);
    this.pageSubject.next(1);
  }

  getServerById(idOrSlug: string): Observable<McpServer | undefined> {
    return this.servers$.pipe(
      map((servers) => {
        const found = servers.find(
          (s) =>
            s.id === idOrSlug ||
            (s.slug && s.slug.toLowerCase() === idOrSlug.toLowerCase()) ||
            s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === idOrSlug.toLowerCase()
        );
        if (!found) return undefined;

        const serverCopy = { ...found };
        if (!serverCopy.tools || serverCopy.tools.length === 0) {
          serverCopy.tools = (serverCopy.capabilities || []).map((cap) => ({
            name: cap,
            description: `Tool endpoint providing ${cap.replace(/_/g, ' ')} operations for this MCP server instance.`,
            returns: 'JSON object with operation response',
            parameters: [
              {
                name: 'payload',
                type: 'object',
                description: `Execution payload options for ${cap}`,
                required: false,
              },
            ],
            inputSchema: {
              type: 'object',
              properties: {
                payload: { type: 'object', description: 'Execution payload' },
              },
            },
            example: {
              action: cap,
              enabled: true,
            },
          }));
        }
        return serverCopy;
      })
    );
  }
}
