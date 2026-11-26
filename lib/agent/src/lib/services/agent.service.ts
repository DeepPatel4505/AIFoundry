import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface AgentParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
}

export interface AgentCapability {
  name: string;
  description: string;
  parameters?: AgentParameter[];
  returns?: string;
  example?: Record<string, any>;
}

export interface AgentModelSettings {
  recommendedModel: string;
  temperature: number;
  maxTokens: number;
  contextWindow?: number;
  streaming: boolean;
}

export interface AgentVersionInfo {
  version: string;
  releaseDate: string;
  changelog: string;
  isLatest: boolean;
}

export interface DiscoveredAgentCard {
  name: string;
  description: string;
  version: string;
  protocolVersion: string;
  agentType: string;
  authMode: string;
  capabilities: AgentCapability[];
  systemPrompt?: string;
  modelSettings?: AgentModelSettings;
  tags: string[];
  documentationUrl?: string;
  gitRepositoryUrl?: string;
  author?: string;
}

export interface PingAgentInput {
  endpointUrl: string;
  authMode: 'None' | 'API Key' | 'Bearer Token';
  agentType?: string;
  credentials?: {
    apiKey?: string;
    token?: string;
  };
}

export interface DynamicRegisterAgentInput extends PingAgentInput {
  visibility: 'public' | 'private';
  discoveredCard: DiscoveredAgentCard;
  customName?: string;
  customDescription?: string;
}

export interface Agent {
  id: string;
  name: string;
  slug?: string;
  description: string;
  agentUrl?: string;
  gitRepo?: string;
  agentType: string;
  authMode: string;
  tags: string[];
  docsLink?: string;
  status: 'active' | 'draft' | 'needs_attention';
  stars: number;
  lastActive: string;
  isPublic: boolean;
  version?: string;
  protocolVersion?: string;
  capabilities?: AgentCapability[];
  systemPrompt?: string;
  modelSettings?: AgentModelSettings;
  versions?: AgentVersionInfo[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private http = inject(HttpClient, { optional: true });
  private apiUrl = 'http://localhost:3000/api/v1/agents';

  private initialAgents: Agent[] = [
    {
      id: '1',
      name: 'sample agent',
      slug: 'sample-agent',
      description: 'Autonomous factual synthesis and multi-source knowledge retrieval agent with A2A protocol negotiation.',
      agentUrl: 'https://api.sampleagent.dev/v1/agent',
      gitRepo: 'https://github.com/janus/sample-agent',
      agentType: 'A2A',
      authMode: 'API Key',
      tags: ['Get Fact', 'General', 'Knowledge Base', 'A2A Swarm'],
      docsLink: 'https://docs.sampleagent.dev',
      status: 'active',
      stars: 14,
      lastActive: 'Just now',
      isPublic: true,
      version: '1.2.0',
      protocolVersion: 'A2A/2.0',
      createdAt: '2026-09-15',
      modelSettings: {
        recommendedModel: 'gemini-2.0-flash',
        temperature: 0.3,
        maxTokens: 4096,
        contextWindow: 128000,
        streaming: true,
      },
      systemPrompt: `# Fact Synthesis & Knowledge Agent
You are an authoritative research and fact-synthesis agent connected to the Janus agent network.
Your mission is to evaluate multi-hop questions, cross-reference external fact repositories, and produce verified, citation-backed answers.

## Directives
1. Never hallucinate facts or statistical numbers. When source confidence is below 95%, explicitly state the uncertainty margin.
2. Structure output into Executive Summary, Verified Facts, and Secondary Hypotheses.
3. Cooperate seamlessly with peer agents via the A2A handshake schema.`,
      capabilities: [
        {
          name: 'get_fact',
          description: 'Search indexed knowledge graphs and peer agents for factual claims with verification timestamps.',
          returns: '{ fact: string, confidenceScore: number, sources: string[] }',
          parameters: [
            {
              name: 'query',
              type: 'string',
              description: 'Target subject or specific claim to fact-check.',
              required: true,
            },
            {
              name: 'strictCitations',
              type: 'boolean',
              description: 'Enforce peer-reviewed academic or cryptographic citation standards.',
              required: false,
              default: true,
            },
          ],
          example: {
            query: 'Superconducting transition temperature of YBCO ceramic oxides',
            strictCitations: true,
          },
        },
        {
          name: 'semantic_synthesis',
          description: 'Synthesize conflicting multi-agent perspectives into a unified consensus summary.',
          returns: '{ consensusText: string, unresolvedDeltas: string[] }',
          parameters: [
            {
              name: 'contextPayloads',
              type: 'array',
              description: 'Array of incoming agent message buffers.',
              required: true,
            },
          ],
          example: {
            contextPayloads: ['AgentA: market bullish', 'AgentB: inflation risk elevated'],
          },
        },
      ],
      versions: [
        {
          version: '1.2.0',
          releaseDate: 'Oct 12, 2026',
          changelog: 'Added A2A Swarm delegation protocol and strict citation mode.',
          isLatest: true,
        },
        {
          version: '1.1.0',
          releaseDate: 'Sep 28, 2026',
          changelog: 'Enhanced semantic synthesis with multi-agent consensus scoring.',
          isLatest: false,
        },
      ],
    },
    {
      id: '2',
      name: 'code reviewer',
      slug: 'code-reviewer',
      description: 'Automates Pull Request reviews, static AST security audits, and latency optimization suggestions.',
      agentUrl: 'https://api.codereview.dev/v1/review',
      gitRepo: 'https://github.com/janus/code-reviewer',
      agentType: 'Assistant',
      authMode: 'Bearer Token',
      tags: ['Audit Code', 'Suggest Optimizations', 'GitHub', 'Security'],
      docsLink: 'https://docs.codereview.dev',
      status: 'active',
      stars: 38,
      lastActive: '12m ago',
      isPublic: true,
      version: '2.0.4',
      protocolVersion: 'REST/v1',
      createdAt: '2026-08-20',
      modelSettings: {
        recommendedModel: 'claude-3-5-sonnet',
        temperature: 0.1,
        maxTokens: 8192,
        contextWindow: 200000,
        streaming: true,
      },
      systemPrompt: `# Senior Code Reviewer & Performance Architect
You analyze pull request diffs and source code files with extreme rigor.
Focus primarily on:
- Algorithmic time and space complexities (O(N) vs O(N^2)).
- Memory leaks, unclosed streams, and garbage collection pressure.
- OWASP Top 10 vulnerabilities (SQLi, command injection, prototype pollution).
- Concurrency bottlenecks and race conditions.

Format your comments with GitHub Markdown code blocks, before/after diffs, and exact rationale.`,
      capabilities: [
        {
          name: 'audit_code',
          description: 'Performs deep static AST analysis detecting anti-patterns, memory leaks, and complexity spikes.',
          returns: 'Array<{ line: number, severity: "HIGH"|"MED"|"LOW", message: string, suggestion: string }>',
          parameters: [
            {
              name: 'sourceCode',
              type: 'string',
              description: 'Raw file code content string.',
              required: true,
            },
            {
              name: 'language',
              type: 'string',
              description: 'Programming language (typescript, python, go, rust).',
              required: true,
            },
          ],
          example: {
            sourceCode: 'function getItems() { return db.query("SELECT * FROM items"); }',
            language: 'typescript',
          },
        },
        {
          name: 'suggest_optimizations',
          description: 'Generates drop-in vectorized or cached code replacements to minimize CPU overhead.',
          returns: '{ optimizedCode: string, benchmarkImpact: string }',
          parameters: [
            {
              name: 'targetFunction',
              type: 'string',
              description: 'Function signature and body to rewrite.',
              required: true,
            },
          ],
          example: {
            targetFunction: 'const compute = (arr) => arr.map(x => x * 2).filter(x => x > 10);',
          },
        },
      ],
      versions: [
        {
          version: '2.0.4',
          releaseDate: 'Oct 18, 2026',
          changelog: 'Rust and Go AST analyzers upgraded; added memory allocation profiler.',
          isLatest: true,
        },
        {
          version: '2.0.0',
          releaseDate: 'Sep 01, 2026',
          changelog: 'Major architectural overhaul to Claude 3.5 Sonnet engine.',
          isLatest: false,
        },
      ],
    },
    {
      id: '3',
      name: 'security guard',
      slug: 'security-guard',
      description: 'Continuous real-time endpoint boundary protection, penetration stress testing, and intrusion response.',
      agentUrl: 'https://api.securityguard.dev/v1/monitor',
      gitRepo: 'https://github.com/janus/security-guard',
      agentType: 'Router',
      authMode: 'None',
      tags: ['OWASP Scan', 'Security', 'Endpoints', 'DDoS Patrol'],
      docsLink: 'https://docs.securityguard.dev',
      status: 'needs_attention',
      stars: 19,
      lastActive: '1h ago',
      isPublic: true,
      version: '1.4.1',
      protocolVersion: 'Webhook/v2',
      createdAt: '2026-07-10',
      modelSettings: {
        recommendedModel: 'gpt-4o',
        temperature: 0.1,
        maxTokens: 4096,
        contextWindow: 128000,
        streaming: false,
      },
      systemPrompt: `# Sentinel Security Router
You are the perimeter defense agent for incoming webhook traffic and automated boundary penetration tests.
Evaluate incoming request signatures, payload entropies, and rate spikes.
Trigger instant circuit breakers when anomalies exceed security threshold z-scores.`,
      capabilities: [
        {
          name: 'owasp_scan',
          description: 'Simulates non-destructive OWASP API security checks against target endpoints.',
          returns: '{ vulnerabilityCount: number, statusReport: string, findings: Array<Finding> }',
          parameters: [
            {
              name: 'targetUrl',
              type: 'string',
              description: 'Target API endpoint to inspect.',
              required: true,
            },
            {
              name: 'threatProfile',
              type: 'string',
              description: 'Threat scan profile: light, standard, or intensive.',
              required: false,
              default: 'standard',
            },
          ],
          example: {
            targetUrl: 'https://api.internal.network/v1/auth',
            threatProfile: 'standard',
          },
        },
        {
          name: 'circuit_breaker_trip',
          description: 'Emergency routing override to blackhole malicious IP clusters.',
          returns: '{ blockedCount: number, executionTimestamp: string }',
          parameters: [
            {
              name: 'cidrBlock',
              type: 'string',
              description: 'IP subnet range to isolate.',
              required: true,
            },
          ],
          example: {
            cidrBlock: '198.51.100.0/24',
          },
        },
      ],
      versions: [
        {
          version: '1.4.1',
          releaseDate: 'Oct 04, 2026',
          changelog: 'Patched anomaly detection engine for high-throughput WebSocket streams.',
          isLatest: true,
        },
      ],
    },
  ];

  private agentsSubject = new BehaviorSubject<Agent[]>(this.initialAgents);
  agents$ = this.agentsSubject.asObservable();

  // Filter and Pagination States
  private searchSubject = new BehaviorSubject<string>('');
  private statusSubject = new BehaviorSubject<string>('All');
  private visibilitySubject = new BehaviorSubject<string>('All');
  private sortSubject = new BehaviorSubject<string>('Recently Updated');
  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(9);

  filteredAgents$: Observable<Agent[]> = combineLatest([
    this.agents$,
    this.searchSubject,
    this.statusSubject,
    this.visibilitySubject,
    this.sortSubject,
  ]).pipe(
    map(([agents, search, status, visibility, sort]) => {
      let filtered = [...agents];

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.tags.some((t) => t.toLowerCase().includes(q)) ||
            (a.agentType && a.agentType.toLowerCase().includes(q))
        );
      }

      // Status Filter
      if (status !== 'All') {
        filtered = filtered.filter((a) => {
          if (status === 'Active') return a.status === 'active';
          if (status === 'Drafts') return a.status === 'draft';
          if (status === 'Needs Attention') return a.status === 'needs_attention';
          return true;
        });
      }

      // Visibility Filter
      if (visibility !== 'All') {
        const isPublic = visibility === 'Public';
        filtered = filtered.filter((a) => a.isPublic === isPublic);
      }

      // Sorting
      if (sort === 'Recently Updated' || sort === 'Recently Created') {
        // Keeping default mock array order
      } else if (sort === 'Name (A-Z)') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sort === 'Most Popular') {
        filtered.sort((a, b) => b.stars - a.stars);
      }

      return filtered;
    })
  );

  paginationMetadata$: Observable<{ page: number; limit: number; total: number; totalPages: number }> = combineLatest([
    this.filteredAgents$,
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

  paginatedAgents$: Observable<Agent[]> = combineLatest([
    this.filteredAgents$,
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

  setStatus(status: string) {
    this.statusSubject.next(status);
    this.pageSubject.next(1);
  }

  setVisibility(visibility: string) {
    this.visibilitySubject.next(visibility);
    this.pageSubject.next(1);
  }

  setSort(sort: string) {
    this.sortSubject.next(sort);
    this.pageSubject.next(1);
  }

  setPage(page: number) {
    this.pageSubject.next(page);
  }

  setLimit(limit: number) {
    this.limitSubject.next(limit);
    this.pageSubject.next(1);
  }

  addAgent(newAgent: Omit<Agent, 'id' | 'lastActive'>) {
    const current = this.agentsSubject.value;
    const added: Agent = {
      ...newAgent,
      id: (current.length + 1).toString(),
      lastActive: 'Just now',
    };
    this.agentsSubject.next([added, ...current]);
    this.pageSubject.next(1);
  }

  getAgentById(idOrSlug: string): Observable<Agent | undefined> {
    return this.agents$.pipe(
      map((agents) => {
        const found = agents.find(
          (a) =>
            a.id === idOrSlug ||
            (a.slug && a.slug.toLowerCase() === idOrSlug.toLowerCase()) ||
            a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === idOrSlug.toLowerCase()
        );
        if (!found) return undefined;

        const copy: Agent = { ...found };
        if (!copy.capabilities || copy.capabilities.length === 0) {
          copy.capabilities = (copy.tags || []).map((tag) => {
            const funcName = tag.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            return {
              name: funcName,
              description: `Autonomous task routine executing ${tag} within the agent's runtime context.`,
              returns: 'JSON response object with execution status and outcome',
              parameters: [
                {
                  name: 'payload',
                  type: 'object',
                  description: `Execution input context for ${tag}`,
                  required: false,
                },
              ],
              example: {
                task: tag,
                parameters: {},
              },
            };
          });
        }
        return copy;
      })
    );
  }

  pingAgentCard(input: PingAgentInput): Observable<DiscoveredAgentCard> {
    if (!this.http) {
      return of(this.synthesizeAgentCard(input));
    }

    const payload = {
      endpointUrl: input.endpointUrl,
      authMode: input.authMode === 'API Key' ? 'API_KEY' : input.authMode === 'Bearer Token' ? 'BEARER' : 'NONE',
      agentType: input.agentType || 'A2A',
      credentials: input.credentials,
    };

    return this.http
      .post<{ success: boolean; data: DiscoveredAgentCard }>(`${this.apiUrl}/ping`, payload)
      .pipe(
        map((res) => res.data),
        catchError(() => {
          // High fidelity graceful fallback if backend is offline or dev mock URL
          return of(this.synthesizeAgentCard(input));
        })
      );
  }

  dynamicRegisterAgent(input: DynamicRegisterAgentInput): Observable<Agent> {
    const card = input.discoveredCard;
    const finalName = input.customName?.trim() || card.name;
    const finalDesc = input.customDescription?.trim() || card.description;
    const slug = finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newAgent: Agent = {
      id: (this.agentsSubject.value.length + 1).toString(),
      name: finalName,
      slug,
      description: finalDesc,
      agentUrl: input.endpointUrl,
      gitRepo: card.gitRepositoryUrl,
      docsLink: card.documentationUrl,
      agentType: card.agentType || 'A2A',
      authMode: input.authMode,
      tags: card.tags && card.tags.length > 0 ? card.tags : ['A2A Swarm', 'General'],
      status: 'active',
      stars: 0,
      lastActive: 'Just now',
      isPublic: input.visibility === 'public',
      version: card.version || '1.0.0',
      protocolVersion: card.protocolVersion || 'A2A/2.0',
      capabilities: card.capabilities,
      systemPrompt: card.systemPrompt,
      modelSettings: card.modelSettings,
      createdAt: new Date().toISOString().split('T')[0],
      versions: [
        {
          version: card.version || '1.0.0',
          releaseDate: 'Just now',
          changelog: 'Initial agent registration via dynamic A2A handshake.',
          isLatest: true,
        },
      ],
    };

    const current = this.agentsSubject.value;
    this.agentsSubject.next([newAgent, ...current]);
    this.pageSubject.next(1);
    return of(newAgent);
  }

  private synthesizeAgentCard(input: PingAgentInput): DiscoveredAgentCard {
    let hostname = 'agent.network.dev';
    let pathHint = 'agent';
    try {
      const parsed = new URL(input.endpointUrl);
      hostname = parsed.hostname.replace(/^(api\.|www\.)/, '');
      const parts = parsed.pathname.split('/').filter(Boolean);
      pathHint = parts[parts.length - 1] || hostname.split('.')[0] || 'agent';
    } catch {
      // ignore
    }

    const cleanTitle = pathHint
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      name: `${cleanTitle} Node`,
      description: `Autonomous intelligent agent node hosted at ${hostname} exposing A2A swarm consensus and verified capabilities.`,
      version: '1.2.0',
      protocolVersion: 'A2A/2.0',
      agentType: input.agentType || 'A2A',
      authMode: input.authMode,
      tags: ['A2A Swarm', 'Verified Node', input.agentType || 'A2A', 'Knowledge'],
      documentationUrl: `https://${hostname}/docs`,
      gitRepositoryUrl: `https://github.com/janus-agents/${pathHint}`,
      systemPrompt: `# ${cleanTitle} Directives\nOperate as an autonomous node on the Janus Registry network.\nExecute delegated peer tasks with verified citations and structured JSON responses.`,
      modelSettings: {
        recommendedModel: 'gemini-2.0-flash',
        temperature: 0.25,
        maxTokens: 4096,
        contextWindow: 128000,
        streaming: true,
      },
      capabilities: [
        {
          name: `${pathHint}_execute`,
          description: `Execute specialized ${cleanTitle} reasoning pipeline and multi-modal task evaluation.`,
          returns: '{ success: boolean, confidence: number, result: any }',
          parameters: [
            {
              name: 'prompt',
              type: 'string',
              description: 'Target query or instruction payload.',
              required: true,
            },
            {
              name: 'strictCitations',
              type: 'boolean',
              description: 'Require verified citation links.',
              required: false,
              default: true,
            },
          ],
          example: {
            prompt: `Run verified analysis on ${cleanTitle} workflow`,
            strictCitations: true,
          },
        },
        {
          name: 'a2a_handshake',
          description: 'Establish peer agent consensus contract and session encryption.',
          returns: '{ status: "connected", protocol: "A2A/2.0" }',
          parameters: [
            {
              name: 'meshNodeId',
              type: 'string',
              description: 'Unique peer node ID on Janus mesh.',
              required: true,
            },
          ],
          example: {
            meshNodeId: 'node_peer_mesh_01',
          },
        },
      ],
    };
  }
}
