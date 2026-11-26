import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { McpService, DiscoveredMcpPreview } from '../../services/mcp.service';
import { McpRegistrationDraftService, McpRegistrationDraft } from '../../services/mcp-registration-draft.service';
import { ToastService } from '@web/shared-ui';

@Component({
  selector: 'lib-mcp-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-dialog.html',
  styleUrl: './add-dialog.css',
})
export class McpAddDialogComponent implements OnInit {
  private mcpService = inject(McpService);
  private draftService = inject(McpRegistrationDraftService);
  private toastService = inject(ToastService);

  isOpen = signal(false);
  currentStep = signal(1);

  // Step 1 Fields
  name = '';
  endpointUrl = '';
  transport: 'STREAMABLE_HTTP' | 'SSE' = 'STREAMABLE_HTTP';
  authType: 'None' | 'Bearer Token' = 'None';
  token = '';

  // Connection State
  isConnecting = signal(false);
  isConnected = signal(false);
  connectionError = signal<string | null>(null);
  discoveredPreview = signal<DiscoveredMcpPreview | null>(null);

  // Step 2 Fields
  description = '';
  tagsInput = '';
  visibility: 'public' | 'private' = 'public';
  isRegistering = signal(false);

  ngOnInit(): void {}

  open(): void {
    this.isOpen.set(true);
    this.currentStep.set(1);
    this.connectionError.set(null);
    this.loadDraft();
  }

  close(): void {
    this.isOpen.set(false);
    this.connectionError.set(null);
  }

  onFieldChange(): void {
    this.saveDraft();
  }

  private saveDraft(): void {
    const draft: McpRegistrationDraft = {
      name: this.name,
      endpointUrl: this.endpointUrl,
      transport: this.transport,
      authType: this.authType === 'Bearer Token' ? 'BEARER' : 'NONE',
      description: this.description,
      visibility: this.visibility === 'public' ? 'PUBLIC' : 'PRIVATE',
      tags: this.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
      credentials: this.authType === 'Bearer Token' && this.token ? { token: this.token } : undefined,
    };
    this.draftService.saveDraft(draft);
  }

  private loadDraft(): void {
    const draft = this.draftService.loadDraft();
    if (!draft) return;

    this.name = draft.name || '';
    this.endpointUrl = draft.endpointUrl || '';
    this.transport = draft.transport || 'STREAMABLE_HTTP';
    this.authType = draft.authType === 'BEARER' ? 'Bearer Token' : 'None';
    this.description = draft.description || '';
    this.visibility = draft.visibility === 'PRIVATE' ? 'private' : 'public';
    this.tagsInput = (draft.tags || []).join(', ');
    if (draft.credentials?.token) {
      this.token = draft.credentials.token;
    }
  }

  forgetDraft(): void {
    this.draftService.clearDraft();
    this.resetForm();
    this.toastService.show('Registration draft discarded.', 'info');
  }

  connect(): void {
    if (!this.name.trim() || !this.endpointUrl.trim()) return;

    this.isConnecting.set(true);
    this.connectionError.set(null);

    const payload = {
      endpointUrl: this.endpointUrl.trim(),
      transport: this.transport,
      authType: (this.authType === 'Bearer Token' ? 'BEARER' : 'NONE') as 'NONE' | 'BEARER',
      credentials: this.authType === 'Bearer Token' && this.token.trim() ? { token: this.token.trim() } : undefined,
    };

    this.mcpService.connectMcpServer(payload).subscribe({
      next: (data) => {
        this.isConnecting.set(false);
        this.isConnected.set(true);
        this.discoveredPreview.set(data);
        this.connectionError.set(null);
        this.toastService.show('MCP handshake succeeded! Capabilities discovered.', 'success');
      },
      error: (err) => {
        this.isConnecting.set(false);
        this.isConnected.set(false);
        const errorMsg =
          err.error?.error?.message ||
          err.message ||
          'Failed to connect to MCP server. Please verify the endpoint URL and credentials.';
        this.connectionError.set(errorMsg);
        this.toastService.show(errorMsg, 'error');
      },
    });
  }

  nextStep(): void {
    if (this.currentStep() < 2 && this.isConnected()) {
      this.currentStep.set(2);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(1);
    }
  }

  register(): void {
    if (!this.name.trim() || !this.endpointUrl.trim()) return;

    this.isRegistering.set(true);

    const tags = this.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      name: this.name.trim(),
      description: this.description.trim(),
      endpointUrl: this.endpointUrl.trim(),
      transport: this.transport,
      authType: (this.authType === 'Bearer Token' ? 'BEARER' : 'NONE') as 'NONE' | 'BEARER',
      visibility: (this.visibility === 'public' ? 'PUBLIC' : 'PRIVATE') as 'PUBLIC' | 'PRIVATE',
      tags: tags.length > 0 ? tags : ['General'],
      credentials: this.authType === 'Bearer Token' && this.token.trim() ? { token: this.token.trim() } : undefined,
    };

    this.mcpService.registerMcpServer(payload).subscribe({
      next: () => {
        this.isRegistering.set(false);
        this.draftService.clearDraft();
        this.toastService.show(`MCP Server "${this.name}" registered successfully!`, 'success');
        this.close();
        this.resetForm();
      },
      error: (err) => {
        this.isRegistering.set(false);
        const errorMsg = err.error?.error?.message || err.message || 'Registration failed';
        this.toastService.show(errorMsg, 'error');
      },
    });
  }

  private resetForm(): void {
    this.currentStep.set(1);
    this.name = '';
    this.endpointUrl = '';
    this.transport = 'STREAMABLE_HTTP';
    this.authType = 'None';
    this.token = '';
    this.isConnected.set(false);
    this.isConnecting.set(false);
    this.connectionError.set(null);
    this.discoveredPreview.set(null);
    this.description = '';
    this.tagsInput = '';
    this.visibility = 'public';
    this.isRegistering.set(false);
  }
}
