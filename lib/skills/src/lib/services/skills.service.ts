import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Skill {
  id: string;
  name: string;
  description: string;
  definition: string;
  category: 'tool' | 'logic' | 'api';
  usageCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class SkillsService {
  private initialSkills: Skill[] = [
    {
      id: 's1',
      name: 'TypeScript Transpilation',
      description: 'Compile and type-check TS files dynamically.',
      definition: 'System prompt to transpile ts code to js using esbuild...',
      category: 'tool',
      usageCount: 142,
    },
    {
      id: 's2',
      name: 'Mermaid Diagram Parsing',
      description: 'Generate visualization graphs from structured schemas.',
      definition: 'Instructions to parse mermaid diagrams syntax and render nodes...',
      category: 'logic',
      usageCount: 89,
    },
    {
      id: 's3',
      name: 'Slack Integration Webhook',
      description: 'Send system notifications and execution status reports to user channels.',
      definition: 'Integrate webhook payload schemas for incoming message logs...',
      category: 'api',
      usageCount: 45,
    },
  ];

  private skillsSubject = new BehaviorSubject<Skill[]>(this.initialSkills);
  skills$ = this.skillsSubject.asObservable();

  // Filter States
  private searchSubject = new BehaviorSubject<string>('');
  private categorySubject = new BehaviorSubject<string>('All');

  filteredSkills$: Observable<Skill[]> = combineLatest([
    this.skills$,
    this.searchSubject,
    this.categorySubject,
  ]).pipe(
    map(([skills, search, category]) => {
      let filtered = [...skills];

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.definition.toLowerCase().includes(q)
        );
      }

      // Category Filter
      if (category !== 'All') {
        filtered = filtered.filter((s) => s.category.toLowerCase() === category.toLowerCase());
      }

      return filtered;
    })
  );

  setSearch(q: string) {
    this.searchSubject.next(q);
  }

  setCategory(category: string) {
    this.categorySubject.next(category);
  }

  addSkill(newSkill: Omit<Skill, 'id' | 'usageCount'>) {
    const current = this.skillsSubject.value;
    const added: Skill = {
      ...newSkill,
      id: 's' + (current.length + 1).toString(),
      usageCount: 0,
    };
    this.skillsSubject.next([added, ...current]);
  }
}
