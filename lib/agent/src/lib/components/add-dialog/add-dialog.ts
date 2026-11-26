import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentService, DiscoveredAgentCard } from '../../services/agent.service';
import { AgentRegistrationDraftService, AgentRegistrationDraft } from '../../services/agent-registration-draft.service';
import { ToastService } from '@web/shared-ui';

@Component({
  selector: 'lib-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-dialog.html',
  styleUrl: './add-dialog.css',
})
export class AddDialogComponent implements OnInit {
  private agentService = inject(AgentService);
  private draftService = inject(AgentRegistrationDraftService);
  private toastService = inject(ToastService);

  isOpen = signal(false);

  // Form Fields
  name = '';
  endpointUrl = '';
  authMode: 'None' | 'API Key' | 'Bearer Token' = 'None';
  apiKey = '';
  token = '';
  visibility: 'public' | 'private' = 'public';

  // Dynamic Discovery State
  isPinging = signal(false);
  pingError = signal<string | null>(null);
  discoveredCard = signal<DiscoveredAgentCard | null>(null);

  // Optional Overrides
  isEditingDetails = signal(false);
  customName = '';
  customDescription = '';

  // Registering
  isRegistering = signal(false);

  // Quick Preset URLs for easy testing
  presetUrls = [
    { label: 'Sentinel Security Agent', url: 'https://api.sentinel-agent.dev/v1/agent' },
    { label: 'Market Analyst Node', url: 'https://mesh.janus.network/agents/analyst' },
  ];

  ngOnInit(): void {}

  open(): void {
    this.isOpen.set(true);
    this.pingError.set(null);
    this.discoveredCard.set(null);
    this.isEditingDetails.set(false);
    this.loadDraft();
  }

  close(): void {
    this.isOpen.set(false);
    this.pingError.set(null);
  }

  applyPreset(url: string): void {
    this.endpointUrl = url;
    this.onFieldChange();
    this.pingAgent();
  }

  onFieldChange(): void {
    this.saveDraft();
  }

  private saveDraft(): void {
    const draft: AgentRegistrationDraft = {
      name: this.name,
      endpointUrl: this.endpointUrl,
      authMode: this.authMode,
      visibility: this.visibility,
      credentials:
        this.authMode === 'API Key' && this.apiKey
          ? { apiKey: this.apiKey }
          : this.authMode === 'Bearer Token' && this.token
          ? { token: this.token }
          : undefined,
    };
    this.draftService.saveDraft(draft);
  }

  private loadDraft(): void {
    const draft = this.draftService.loadDraft();
    if (!draft) return;

    this.name = draft.name || '';
    this.endpointUrl = draft.endpointUrl || '';
    this.authMode = draft.authMode || 'None';
    this.visibility = draft.visibility || 'public';
    if (draft.credentials?.apiKey) {
      this.apiKey = draft.credentials.apiKey;
    }
    if (draft.credentials?.token) {
      this.token = draft.credentials.token;
    }
  }

  forgetDraft(): void {
    this.draftService.clearDraft();
    this.name = '';
    this.endpointUrl = '';
    this.authMode = 'None';
    this.apiKey = '';
    this.token = '';
    this.visibility = 'public';
    this.discoveredCard.set(null);
    this.toastService.show('Agent registration draft cleared.', 'info');
  }

  pingAgent(): void {
    if (!this.endpointUrl.trim()) return;

    this.isPinging.set(true);
    this.pingError.set(null);

    const credentials =
      this.authMode === 'API Key' && this.apiKey
        ? { apiKey: this.apiKey }
        : this.authMode === 'Bearer Token' && this.token
        ? { token: this.token }
        : undefined;

    this.agentService
      .pingAgentCard({
        endpointUrl: this.endpointUrl.trim(),
        authMode: this.authMode,
        credentials,
      })
      .subscribe({
        next: (card) => {
          this.isPinging.set(false);
          this.discoveredCard.set(card);
          if (!this.name.trim()) {
            this.name = card.name;
          }
          this.customName = this.name || card.name;
          this.customDescription = card.description;
          this.toastService.show(`Agent card "${card.name}" verified!`, 'success');
        },
        error: (err) => {
          this.isPinging.set(false);
          this.pingError.set(err?.message || 'Failed to ping agent endpoint. Check URL and credentials.');
          this.toastService.show('Failed to discover Agent Card.', 'error');
        },
      });
  }

  useDiscoveredName(cardName: string): void {
    this.name = cardName;
    this.customName = cardName;
    this.onFieldChange();
  }

  toggleEditDetails(): void {
    this.isEditingDetails.update((v) => !v);
  }

  register(): void {
    const card = this.discoveredCard();
    if (!card) return;

    this.isRegistering.set(true);

    const credentials =
      this.authMode === 'API Key' && this.apiKey
        ? { apiKey: this.apiKey }
        : this.authMode === 'Bearer Token' && this.token
        ? { token: this.token }
        : undefined;

    const finalName = this.name.trim() || this.customName.trim() || card.name;
    const finalDescription = this.customDescription?.trim() || card.description;

    this.agentService
      .dynamicRegisterAgent({
        endpointUrl: this.endpointUrl.trim(),
        authMode: this.authMode,
        visibility: this.visibility,
        credentials,
        discoveredCard: card,
        customName: finalName,
        customDescription: finalDescription,
      })
      .subscribe({
        next: (agent) => {
          this.isRegistering.set(false);
          this.draftService.clearDraft();
          this.toastService.show(`Agent "${agent.name}" registered to Janus!`, 'success');
          this.close();
        },
        error: (err) => {
          this.isRegistering.set(false);
          this.toastService.show(err?.message || 'Failed to register agent.', 'error');
        },
      });
  }
}
