import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgentService, Agent, AgentCapability } from '../../services/agent.service';
import { ToastService } from '@web/shared-ui';

export type LanguageTab = 'curl' | 'python' | 'typescript' | 'a2a';
export type MainTab = 'capabilities' | 'integration' | 'instructions';

@Component({
  selector: 'lib-agent-feature-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './feature-detail.html',
  styleUrl: './feature-detail.css',
})
export class AgentFeatureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private agentService = inject(AgentService);
  private toastService = inject(ToastService);

  agent = signal<Agent | null>(null);
  isLoading = signal(true);
  isError = signal(false);

  // Tabs
  activeTab = signal<MainTab>('capabilities');
  selectedLang = signal<LanguageTab>('curl');

  // Capability search & expansion
  capabilitySearch = signal<string>('');
  expandedExamples = signal<Record<string, boolean>>({});

  // Stars
  isStarred = signal(false);
  starCount = signal(0);

  // Filtered Capabilities
  filteredCapabilities = computed<AgentCapability[]>(() => {
    const a = this.agent();
    if (!a || !a.capabilities) return [];
    const query = this.capabilitySearch().trim().toLowerCase();
    if (!query) return a.capabilities;
    return a.capabilities.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.parameters?.some((p) => p.name.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.agentService.getAgentById(id).subscribe({
      next: (agent) => {
        if (agent) {
          this.agent.set(agent);
          this.starCount.set(agent.stars || 0);
          this.isLoading.set(false);
        } else {
          this.isError.set(true);
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  setTab(tab: MainTab): void {
    this.activeTab.set(tab);
  }

  selectLang(lang: LanguageTab): void {
    this.selectedLang.set(lang);
  }

  toggleExample(capName: string): void {
    this.expandedExamples.update((prev) => ({
      ...prev,
      [capName]: !prev[capName],
    }));
  }

  isExampleExpanded(capName: string): boolean {
    return !!this.expandedExamples()[capName];
  }

  toggleStar(): void {
    if (this.isStarred()) {
      this.isStarred.set(false);
      this.starCount.update((c) => Math.max(0, c - 1));
      this.toastService.show('Agent removed from starred collection', 'info');
    } else {
      this.isStarred.set(true);
      this.starCount.update((c) => c + 1);
      this.toastService.show('Agent added to your starred collection!', 'success');
    }
  }

  copyEndpoint(): void {
    const a = this.agent();
    if (!a || !a.agentUrl) return;
    navigator.clipboard.writeText(a.agentUrl).then(
      () => this.toastService.show(`Endpoint URL copied to clipboard!`, 'success'),
      () => this.toastService.show('Failed to copy endpoint URL.', 'error')
    );
  }

  shareUrl(): void {
    navigator.clipboard.writeText(window.location.href).then(
      () => this.toastService.show('Agent link copied to clipboard!', 'success'),
      () => this.toastService.show('Failed to copy link.', 'error')
    );
  }

  copySnippet(code: string, label: string = 'Code'): void {
    navigator.clipboard.writeText(code).then(
      () => this.toastService.show(`${label} snippet copied to clipboard!`, 'success'),
      () => this.toastService.show('Failed to copy snippet.', 'error')
    );
  }

  copyCapabilityPayload(cap: AgentCapability): void {
    const payload = this.getCapabilityPayload(cap);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(
      () => this.toastService.show(`Payload example for "${cap.name}" copied!`, 'success'),
      () => this.toastService.show('Failed to copy payload.', 'error')
    );
  }

  getCapabilityPayload(cap: AgentCapability): Record<string, any> {
    if (cap.example) return cap.example;
    const fallback: Record<string, any> = {};
    if (cap.parameters) {
      for (const p of cap.parameters) {
        fallback[p.name] = p.default !== undefined ? p.default : p.type === 'number' ? 0 : p.type === 'boolean' ? true : 'example_value';
      }
    }
    return fallback;
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  // Code Snippet Generators
  getCurlSnippet(): string {
    const a = this.agent();
    if (!a) return '';
    const url = a.agentUrl || 'https://api.janus-registry.dev/v1/agents/invoke';
    const firstCap = a.capabilities && a.capabilities.length > 0 ? a.capabilities[0] : null;
    const action = firstCap ? firstCap.name : 'execute';
    const params = firstCap ? this.getCapabilityPayload(firstCap) : { input: 'Provide synthesis of recent benchmarks' };

    const payload = {
      jsonrpc: '2.0',
      id: 'req_01j7b9k',
      method: action,
      params,
    };

    return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${JANUS_AGENT_TOKEN}" \\
  -d '${JSON.stringify(payload, null, 2).replace(/'/g, "'\\''")}'`;
  }

  getPythonSnippet(): string {
    const a = this.agent();
    if (!a) return '';
    const url = a.agentUrl || 'https://api.janus-registry.dev/v1/agents/invoke';
    const firstCap = a.capabilities && a.capabilities.length > 0 ? a.capabilities[0] : null;
    const action = firstCap ? firstCap.name : 'execute';
    const params = firstCap ? this.getCapabilityPayload(firstCap) : { query: 'Synthesize findings' };

    return `import os
import requests

AGENT_ENDPOINT = os.getenv("JANUS_AGENT_ENDPOINT", "${url}")
AUTH_TOKEN = os.getenv("JANUS_AGENT_TOKEN", "janus_live_sec_key_xyz987")

def invoke_agent():
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json",
        "X-Janus-Protocol": "${a.protocolVersion || 'A2A/2.0'}"
    }

    payload = {
        "jsonrpc": "2.0",
        "id": "py_task_01",
        "method": "${action}",
        "params": ${JSON.stringify(params, null, 8).replace(/\n\s{8}/g, '\n        ')}
    }

    response = requests.post(AGENT_ENDPOINT, json=payload, headers=headers, timeout=30)
    response.raise_for_status()

    result = response.json()
    print("Agent Result:", result.get("result"))
    return result

if __name__ == "__main__":
    invoke_agent()`;
  }

  getTypeScriptSnippet(): string {
    const a = this.agent();
    if (!a) return '';
    const url = a.agentUrl || 'https://api.janus-registry.dev/v1/agents/invoke';
    const firstCap = a.capabilities && a.capabilities.length > 0 ? a.capabilities[0] : null;
    const action = firstCap ? firstCap.name : 'execute';
    const params = firstCap ? this.getCapabilityPayload(firstCap) : { query: 'Synthesize findings' };

    return `import { JanusAgentClient } from '@janus/sdk';

interface AgentResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string;
  result: T;
  metrics?: { latencyMs: number; tokensUsed: number };
}

async function runAgent() {
  const client = new JanusAgentClient({
    endpoint: process.env['JANUS_AGENT_ENDPOINT'] ?? '${url}',
    apiKey: process.env['JANUS_AGENT_TOKEN'] ?? 'janus_live_sec_key_xyz987',
    protocolVersion: '${a.protocolVersion || 'A2A/2.0'}',
  });

  console.log('Initiating task with ${a.name}...');
  const response = await client.invoke<AgentResponse>({
    capability: '${action}',
    parameters: ${JSON.stringify(params, null, 4).replace(/\n/g, '\n    ')},
    streaming: ${a.modelSettings?.streaming ?? true},
  });

  console.log('Agent Response Received:', response.result);
}

runAgent().catch(console.error);`;
  }

  getA2aSnippet(): string {
    const a = this.agent();
    if (!a) return '';
    const url = a.agentUrl || 'https://api.janus-registry.dev/v1/agents/invoke';
    const firstCap = a.capabilities && a.capabilities.length > 0 ? a.capabilities[0] : null;
    const action = firstCap ? firstCap.name : 'delegate_task';

    const handshakePayload = {
      jsonrpc: '2.0',
      id: 'a2a_handshake_001',
      method: 'a2a.negotiate',
      params: {
        initiatorNodeId: 'node_peer_agent_primary',
        targetNode: a.name,
        protocol: a.protocolVersion || 'A2A/2.0',
        capabilitiesRequested: [action],
        sessionTtlSeconds: 3600,
      },
    };

    const taskPayload = {
      jsonrpc: '2.0',
      id: 'a2a_dispatch_002',
      method: 'a2a.delegate',
      params: {
        sessionId: 'sess_a2a_live_token_77a',
        action: action,
        priority: 'high',
        payload: firstCap ? this.getCapabilityPayload(firstCap) : { prompt: 'Verify consensus claims' },
        callbackEndpoint: 'https://orchestrator.janus.internal/v1/a2a/callback',
      },
    };

    return `// A2A (Agent-to-Agent) Swarm Peer Negotiation & Delegation
// 1. Initial Handshake & Capability Exchange
POST ${url}
Headers:
  Authorization: Bearer \${JANUS_SWARM_TOKEN}
  X-A2A-Swarm-Id: swarm_consensus_mesh_01
Body:
${JSON.stringify(handshakePayload, null, 2)}

// 2. Direct Task Delegation Envelope
POST ${url}
Body:
${JSON.stringify(taskPayload, null, 2)}`;
  }

  getExpectedResponseSnippet(): string {
    const a = this.agent();
    if (!a) return '';
    const firstCap = a.capabilities && a.capabilities.length > 0 ? a.capabilities[0] : null;

    if (firstCap && firstCap.returns) {
      return JSON.stringify(
        {
          jsonrpc: '2.0',
          id: 'req_01j7b9k',
          result: {
            status: 'completed',
            executionTimeMs: 142,
            capability: firstCap.name,
            output: firstCap.example
              ? { verified: true, consensusConfidence: 0.98, citationsCount: 4 }
              : { data: 'Verification verified and validated across 3 peer nodes.' },
          },
        },
        null,
        2
      );
    }

    return JSON.stringify(
      {
        jsonrpc: '2.0',
        id: 'req_01j7b9k',
        result: {
          status: 'success',
          executionTimeMs: 185,
          agent: a.name,
          data: {
            summary: 'Operation processed successfully.',
            confidence: 0.99,
          },
        },
      },
      null,
      2
    );
  }
}
