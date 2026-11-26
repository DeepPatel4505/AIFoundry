import { Injectable } from '@angular/core';

export interface AgentRegistrationDraft {
  name?: string;
  endpointUrl: string;
  authMode: 'None' | 'API Key' | 'Bearer Token';
  visibility: 'public' | 'private';
  agentType?: string;
  credentials?: {
    apiKey?: string;
    token?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AgentRegistrationDraftService {
  private readonly storageKey = 'janus:agent-registration:draft:v1';

  saveDraft(draft: AgentRegistrationDraft): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(draft));
    } catch (err) {
      console.warn('Failed to save Agent registration draft to localStorage', err);
    }
  }

  loadDraft(): AgentRegistrationDraft | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      return JSON.parse(data) as AgentRegistrationDraft;
    } catch (err) {
      console.warn('Failed to load Agent registration draft from localStorage', err);
      return null;
    }
  }

  clearDraft(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (err) {
      console.warn('Failed to clear Agent registration draft', err);
    }
  }

  clearCredentials(): void {
    try {
      const draft = this.loadDraft();
      if (draft) {
        delete draft.credentials;
        this.saveDraft(draft);
      }
    } catch (err) {
      console.warn('Failed to clear credentials from draft', err);
    }
  }
}
