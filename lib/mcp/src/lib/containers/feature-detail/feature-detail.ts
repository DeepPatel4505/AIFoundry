import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { McpService, McpServer, McpTool } from '../../services/mcp.service';
import { ToastService } from '@web/shared-ui';

export interface IdeDefinition {
  id: 'cursor' | 'vscode' | 'claude' | 'windsurf' | 'jetbrains' | 'zed';
  name: string;
  tagline: string;
  icon: string;
  configFile: string;
}

@Component({
  selector: 'lib-mcp-feature-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './feature-detail.html',
  styleUrl: './feature-detail.css',
})
export class McpFeatureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private mcpService = inject(McpService);
  private toastService = inject(ToastService);

  server = signal<McpServer | null>(null);
  isLoading = signal(true);
  isError = signal(false);

  // Main Tabs: 'ides' | 'tools'
  activeTab = signal<'ides' | 'tools'>('ides');

  // IDE Selection State
  selectedIde = signal<'cursor' | 'vscode' | 'claude' | 'windsurf' | 'jetbrains' | 'zed'>('cursor');
  selectedOs = signal<'windows' | 'mac' | 'linux'>('windows');

  // Tools Search Filter & Expansion
  toolSearch = signal<string>('');
  expandedSchemas = signal<Record<string, boolean>>({});

  // Star state
  isStarred = signal(false);
  starCount = signal(0);

  // Supported IDEs list
  readonly ides: IdeDefinition[] = [
    {
      id: 'cursor',
      name: 'Cursor',
      tagline: 'AI Code Editor with built-in MCP client',
      icon: 'cursor',
      configFile: '~/.cursor/mcp.json',
    },
    {
      id: 'vscode',
      name: 'VS Code',
      tagline: 'Cline, Roo Code, Continue & Claude Dev',
      icon: 'vscode',
      configFile: 'cline_mcp_settings.json',
    },
    {
      id: 'claude',
      name: 'Claude Desktop',
      tagline: 'Anthropic native macOS & Windows desktop app',
      icon: 'claude',
      configFile: 'claude_desktop_config.json',
    },
    {
      id: 'windsurf',
      name: 'Windsurf',
      tagline: 'Codeium AI IDE with Cascade agent',
      icon: 'windsurf',
      configFile: '~/.codeium/windsurf/mcp_config.json',
    },
    {
      id: 'jetbrains',
      name: 'JetBrains',
      tagline: 'IntelliJ IDEA, WebStorm, PyCharm MCP plugin',
      icon: 'jetbrains',
      configFile: '.idea/mcp.json',
    },
    {
      id: 'zed',
      name: 'Zed',
      tagline: 'High-performance editor context servers',
      icon: 'zed',
      configFile: 'settings.json',
    },
  ];

  filteredTools = computed<McpTool[]>(() => {
    const s = this.server();
    if (!s || !s.tools) return [];
    const query = this.toolSearch().trim().toLowerCase();
    if (!query) return s.tools;
    return s.tools.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        (t.parameters && t.parameters.some((p) => p.name.toLowerCase().includes(query)))
    );
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadServerDetails(id);
      } else {
        this.isError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  private loadServerDetails(idOrSlug: string): void {
    this.isLoading.set(true);
    this.isError.set(false);

    this.mcpService.getServerById(idOrSlug).subscribe({
      next: (data) => {
        if (data) {
          this.server.set(data);

          // Star count and local persistence
          const localStarKey = `janus-mcp-starred-${data.id}`;
          const localIsStarred = localStorage.getItem(localStarKey) === 'true';
          this.isStarred.set(localIsStarred);

          const baseStars = data.stars !== undefined ? data.stars : Math.floor(Math.random() * 28) + 12;
          this.starCount.set(localIsStarred ? baseStars + 1 : baseStars);
        } else {
          this.isError.set(true);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load MCP server details:', err);
        this.isError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  setTab(tab: 'ides' | 'tools'): void {
    this.activeTab.set(tab);
  }

  selectIde(ideId: 'cursor' | 'vscode' | 'claude' | 'windsurf' | 'jetbrains' | 'zed'): void {
    this.selectedIde.set(ideId);
  }

  selectOs(os: 'windows' | 'mac' | 'linux'): void {
    this.selectedOs.set(os);
  }

  toggleSchema(toolName: string): void {
    const cur = this.expandedSchemas();
    this.expandedSchemas.set({
      ...cur,
      [toolName]: !cur[toolName],
    });
  }

  isSchemaExpanded(toolName: string): boolean {
    return !!this.expandedSchemas()[toolName];
  }

  getServerKey(): string {
    const s = this.server();
    if (!s) return 'mcp-server';
    if (s.slug) return s.slug;
    return s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  getIdeConfigSnippet(): string {
    const s = this.server();
    if (!s) return '{}';

    const serverKey = this.getServerKey();
    const ide = this.selectedIde();
    const transport = s.transport || (s.url.startsWith('localhost') ? 'STDIO' : 'STREAMABLE_HTTP');

    // Zed uses a distinct config schema under "context_servers"
    if (ide === 'zed') {
      if (transport === 'STDIO') {
        const cmd = s.command || 'npx';
        const args = s.args || ['-y', `@modelcontextprotocol/server-${serverKey}`];
        const configObj = {
          context_servers: {
            [serverKey]: {
              command: {
                path: cmd,
                args: args,
              },
            },
          },
        };
        return JSON.stringify(configObj, null, 2);
      } else {
        const configObj = {
          context_servers: {
            [serverKey]: {
              endpoint: s.url.startsWith('http') ? s.url : `http://${s.url}`,
              settings: s.authType !== 'None' ? { apiKey: '<YOUR_API_KEY>' } : {},
            },
          },
        };
        return JSON.stringify(configObj, null, 2);
      }
    }

    // VS Code / Cline / Claude Desktop / Cursor / Windsurf / JetBrains schema
    if (transport === 'STDIO') {
      const cmd = s.command || 'npx';
      const args = s.args || ['-y', `@modelcontextprotocol/server-${serverKey}`];
      const configObj: Record<string, any> = {
        mcpServers: {
          [serverKey]: {
            command: cmd,
            args: args,
            ...(s.env ? { env: s.env } : {}),
          },
        },
      };
      return JSON.stringify(configObj, null, 2);
    }

    // HTTP / SSE Transport
    const endpoint = s.url.startsWith('http') ? s.url : `https://${s.url}`;
    const serverEntry: Record<string, any> = {
      url: endpoint,
    };

    if (transport === 'SSE' || ide === 'vscode') {
      serverEntry['transport'] = 'sse';
    }

    if (s.authType === 'API Key') {
      serverEntry['headers'] = {
        'x-api-key': '${API_KEY}',
      };
    } else if (s.authType === 'Bearer Token') {
      serverEntry['headers'] = {
        Authorization: 'Bearer ${TOKEN}',
      };
    }

    const fullConfig = {
      mcpServers: {
        [serverKey]: serverEntry,
      },
    };

    return JSON.stringify(fullConfig, null, 2);
  }

  getIdeFilePath(): string {
    const ide = this.selectedIde();
    const os = this.selectedOs();

    switch (ide) {
      case 'cursor':
        if (os === 'windows') return '%USERPROFILE%\\.cursor\\mcp.json';
        if (os === 'mac') return '~/.cursor/mcp.json';
        return '~/.cursor/mcp.json';

      case 'vscode':
        if (os === 'windows')
          return '%APPDATA%\\Code\\User\\globalStorage\\saoudrizwan.claude-dev\\settings\\cline_mcp_settings.json';
        if (os === 'mac')
          return '~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json';
        return '~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json';

      case 'claude':
        if (os === 'windows') return '%APPDATA%\\Claude\\claude_desktop_config.json';
        if (os === 'mac') return '~/Library/Application Support/Claude/claude_desktop_config.json';
        return '~/.config/Claude/claude_desktop_config.json';

      case 'windsurf':
        if (os === 'windows') return '%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json';
        if (os === 'mac') return '~/.codeium/windsurf/mcp_config.json';
        return '~/.codeium/windsurf/mcp_config.json';

      case 'jetbrains':
        return '.idea/mcp.json (Project Root) or IDE Settings > Tools > MCP';

      case 'zed':
        if (os === 'windows') return '%APPDATA%\\Zed\\settings.json';
        if (os === 'mac') return '~/.config/zed/settings.json';
        return '~/.config/zed/settings.json';

      default:
        return 'mcp.json';
    }
  }

  getIdeInstructions(): string[] {
    const ide = this.selectedIde();
    const serverName = this.server()?.name || 'this MCP server';

    switch (ide) {
      case 'cursor':
        return [
          'Open Cursor and press Ctrl+, (or Cmd+, on macOS) to open Settings.',
          'Navigate to Features > MCP Servers in the settings sidebar.',
          'Click "Add New MCP Server" or edit the mcp.json config file directly at the path indicated above.',
          'Paste the generated JSON configuration and save the file.',
          'Verify the status indicator displays green (Connected). Your Cursor Composer and chat can now invoke tools from ' +
            serverName +
            '.',
        ];

      case 'vscode':
        return [
          'Install the Cline or Roo Code extension in VS Code if not already active.',
          'Click the MCP icon at the top of the Cline sidebar panel.',
          'Click "Configure MCP Servers" to open cline_mcp_settings.json.',
          'Paste the configuration into the "mcpServers" dictionary and save.',
          'Cline will instantly load the exposed tools and enable them during agent chat loops.',
        ];

      case 'claude':
        return [
          'Open the Claude Desktop configuration file at the path shown above.',
          'Add the server entry under the top-level "mcpServers" object in the JSON file.',
          'Save your changes and completely restart Claude Desktop (Quit from taskbar/dock and reopen).',
          'Look for the hammer/plug icon in the chat composer to verify ' + serverName + ' tools are available.',
        ];

      case 'windsurf':
        return [
          'Open your Windsurf IDE workspace.',
          'Navigate to or create the global MCP configuration at ~/.codeium/windsurf/mcp_config.json.',
          'Insert the generated server definition and save the file.',
          'Cascade will automatically refresh its tools registry and enable tool execution.',
        ];

      case 'jetbrains':
        return [
          'Open your JetBrains IDE (IntelliJ IDEA, WebStorm, PyCharm, etc.).',
          'Ensure the Model Context Protocol (MCP) or Junie integration plugin is enabled.',
          'Create or update .idea/mcp.json in your project root, or paste the snippet in Settings > Tools > MCP.',
          'Reload the MCP server list in the MCP tool panel to activate all exposed schemas.',
        ];

      case 'zed':
        return [
          'Open Zed and open Settings (Cmd+, or Ctrl+,) or open settings.json.',
          'Add the server block under "context_servers" in your configuration file.',
          'Save settings.json; Zed will spawn the context server process.',
          'In the assistant panel, the agent will have contextual access to the tools.',
        ];
    }
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  copyConfig(): void {
    const code = this.getIdeConfigSnippet();
    navigator.clipboard.writeText(code).then(
      () => this.toastService.show('IDE configuration copied to clipboard!', 'success'),
      () => this.toastService.show('Failed to copy configuration.', 'error')
    );
  }

  copyFilePath(): void {
    const path = this.getIdeFilePath();
    navigator.clipboard.writeText(path).then(
      () => this.toastService.show(`Copied config path: "${path}"`, 'success'),
      () => this.toastService.show('Failed to copy path.', 'error')
    );
  }

  copyEndpoint(): void {
    const s = this.server();
    if (!s) return;
    navigator.clipboard.writeText(s.url).then(
      () => this.toastService.show(`Copied endpoint: "${s.url}"`, 'success'),
      () => this.toastService.show('Failed to copy endpoint.', 'error')
    );
  }

  copyToolExample(tool: McpTool): void {
    const payload = {
      tool: tool.name,
      arguments: tool.example || {},
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(
      () => this.toastService.show(`Copied sample invocation for "${tool.name}"!`, 'success'),
      () => this.toastService.show('Failed to copy payload.', 'error')
    );
  }

  copyToolName(name: string): void {
    navigator.clipboard.writeText(name).then(
      () => this.toastService.show(`Copied tool name "${name}"`, 'success'),
      () => this.toastService.show('Failed to copy tool name.', 'error')
    );
  }

  shareUrl(): void {
    navigator.clipboard.writeText(window.location.href).then(
      () => this.toastService.show('Server link copied to clipboard!', 'success'),
      () => this.toastService.show('Failed to copy link.', 'error')
    );
  }

  toggleStar(): void {
    const s = this.server();
    if (!s) return;

    const localStarKey = `janus-mcp-starred-${s.id}`;
    const nextStarred = !this.isStarred();

    this.isStarred.set(nextStarred);
    localStorage.setItem(localStarKey, String(nextStarred));

    if (nextStarred) {
      this.starCount.update((count) => count + 1);
      this.toastService.show('Added MCP server to starred list!', 'success');
    } else {
      this.starCount.update((count) => Math.max(0, count - 1));
      this.toastService.show('Removed MCP server from starred list.', 'info');
    }
  }
}
