import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface McpServer {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'connected' | 'disconnected';
  authType: string;
  tags: string[];
  isPublic: boolean;
  capabilities: string[];
}

@Injectable({
  providedIn: 'root',
})
export class McpService {
  private initialServers: McpServer[] = [
    {
      id: 'm1',
      name: 'Local Filesystem MCP',
      description: 'Provides safe, sandboxed reading and writing capabilities within specified workspaces.',
      url: 'localhost:8081/mcp/fs',
      status: 'connected',
      authType: 'None',
      tags: ['System', 'File IO'],
      isPublic: true,
      capabilities: ['read_file', 'write_file', 'list_directory'],
    },
    {
      id: 'm2',
      name: 'PostgreSQL Database Connector',
      description: 'Translates natural query logic into optimized SQL execution schemas and index analyses.',
      url: 'postgres-mcp-internal.janus.net',
      status: 'connected',
      authType: 'API Key',
      tags: ['Database', 'SQL'],
      isPublic: true,
      capabilities: ['query_schema', 'execute_readonly', 'explain_plan'],
    },
    {
      id: 'm3',
      name: 'Web Search Engine API',
      description: 'Allows agent access to live Google Search indices for real-time validation.',
      url: 'google-search.mcp.janus.net',
      status: 'connected',
      authType: 'Bearer Token',
      tags: ['Web Search', 'API'],
      isPublic: false,
      capabilities: ['web_search', 'extract_article'],
    },
  ];

  private serversSubject = new BehaviorSubject<McpServer[]>(this.initialServers);
  servers$ = this.serversSubject.asObservable();

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

  setSearch(q: string) {
    this.searchSubject.next(q);
    this.pageSubject.next(1);
  }

  setVisibility(visibility: string) {
    this.visibilitySubject.next(visibility);
    this.pageSubject.next(1);
  }

  setPage(page: number) {
    this.pageSubject.next(page);
  }

  setLimit(limit: number) {
    this.limitSubject.next(limit);
    this.pageSubject.next(1);
  }

  addMcpServer(newServer: Omit<McpServer, 'id' | 'status' | 'capabilities'>) {
    const current = this.serversSubject.value;
    const added: McpServer = {
      ...newServer,
      id: 'm' + (current.length + 1).toString(),
      status: 'connected', // default connection status after successful registration
      capabilities: ['initialize', 'list_tools', 'call_tool'], // default mock capabilities
    };
    this.serversSubject.next([added, ...current]);
    this.pageSubject.next(1);
  }
}
