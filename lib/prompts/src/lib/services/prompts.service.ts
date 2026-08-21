import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PromptVariable {
  name: string;
  description: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  tags: string[];
  isPublic: boolean;
  variables: PromptVariable[];
  changeLog?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PromptsService {
  private initialPrompts: PromptTemplate[] = [
    {
      id: 'p1',
      name: 'Refactoring Advisor',
      description: 'Checks inputs for code smells, layout issues, and suggests TypeScript improvements.',
      template: 'Review the following Angular code block. Identify memory leaks, check standalone declarations, and propose modern clean code edits: \n\n{{code}}',
      tags: ['Development', 'Angular', 'Quality'],
      isPublic: true,
      variables: [{ name: 'code', description: 'The TypeScript source code block to review' }],
      model: 'Gemini 2.0 Flash',
      maxTokens: 2048,
      temperature: 0.7,
    },
    {
      id: 'p2',
      name: 'SQL Schematizer',
      description: 'Generates robust tables from text specifications.',
      template: 'Create a PostgreSQL schema from this requirements summary: "{{requirements}}". Ensure foreign key references are correct and indexes are built for high-performance retrieval.',
      tags: ['Database', 'SQL', 'Structure'],
      isPublic: true,
      variables: [{ name: 'requirements', description: 'Feature details for database tables structures' }],
      model: 'Gemini 1.5 Pro',
      maxTokens: 4096,
      temperature: 0.2,
    },
  ];

  private promptsSubject = new BehaviorSubject<PromptTemplate[]>(this.initialPrompts);
  prompts$ = this.promptsSubject.asObservable();

  // Filter States
  private searchSubject = new BehaviorSubject<string>('');
  private visibilitySubject = new BehaviorSubject<string>('All');

  filteredPrompts$: Observable<PromptTemplate[]> = combineLatest([
    this.prompts$,
    this.searchSubject,
    this.visibilitySubject,
  ]).pipe(
    map(([prompts, search, visibility]) => {
      let filtered = [...prompts];

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }

      // Visibility Filter
      if (visibility !== 'All') {
        const isPublic = visibility === 'Public';
        filtered = filtered.filter((p) => p.isPublic === isPublic);
      }

      return filtered;
    })
  );

  setSearch(q: string) {
    this.searchSubject.next(q);
  }

  setVisibility(visibility: string) {
    this.visibilitySubject.next(visibility);
  }

  addPrompt(newPrompt: Omit<PromptTemplate, 'id'>) {
    const current = this.promptsSubject.value;
    const added: PromptTemplate = {
      ...newPrompt,
      id: 'p' + (current.length + 1).toString(),
    };
    this.promptsSubject.next([added, ...current]);
  }
}
