import { Injectable } from '@angular/core';

export interface McpRegistrationDraft {
  name: string;
  endpointUrl: string;
  transport: 'STREAMABLE_HTTP' | 'SSE';
  authType: 'NONE' | 'BEARER';
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  tags: string[];
  credentials?: {
    token?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class McpRegistrationDraftService {
  private readonly storageKey = 'janus:mcp-registration:draft:v1';

  saveDraft(draft: McpRegistrationDraft): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(draft));
    } catch (err) {
      console.warn('Failed to save MCP registration draft to localStorage', err);
    }
  }

  loadDraft(): McpRegistrationDraft | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      return JSON.parse(data) as McpRegistrationDraft;
    } catch (err) {
      console.warn('Failed to load MCP registration draft from localStorage', err);
      return null;
    }
  }

  clearDraft(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (err) {
      console.warn('Failed to clear MCP registration draft', err);
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
