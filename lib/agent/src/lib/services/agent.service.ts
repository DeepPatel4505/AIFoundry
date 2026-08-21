import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Agent {
  id: string;
  name: string;
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
}

@Injectable({
  providedIn: 'root',
})
export class AgentService {
  private initialAgents: Agent[] = [
    {
      id: '1',
      name: 'sample agent',
      description: 'Sample Agent description',
      agentUrl: 'https://api.sampleagent.dev',
      gitRepo: 'https://github.com/janus/sample-agent',
      agentType: 'A2A',
      authMode: 'API Key',
      tags: ['Get Fact', 'General'],
      docsLink: 'https://docs.sampleagent.dev',
      status: 'active',
      stars: 2,
      lastActive: 'Just now',
      isPublic: true,
    },
    {
      id: '2',
      name: 'code reviewer',
      description: 'Reviews pull requests and provides optimization suggestions.',
      agentUrl: 'https://api.codereview.dev',
      gitRepo: 'https://github.com/janus/code-reviewer',
      agentType: 'Assistant',
      authMode: 'Bearer Token',
      tags: ['Audit Code', 'Suggest Optimizations', 'GitHub'],
      docsLink: 'https://docs.codereview.dev',
      status: 'draft',
      stars: 5,
      lastActive: '12m ago',
      isPublic: false,
    },
    {
      id: '3',
      name: 'security guard',
      description: 'Monitors endpoints and handles stress testing scans.',
      agentUrl: 'https://api.securityguard.dev',
      gitRepo: 'https://github.com/janus/security-guard',
      agentType: 'Router',
      authMode: 'None',
      tags: ['OWASP Scan', 'Security', 'Endpoints'],
      docsLink: 'https://docs.securityguard.dev',
      status: 'needs_attention',
      stars: 0,
      lastActive: '1h ago',
      isPublic: true,
    },
  ];

  private agentsSubject = new BehaviorSubject<Agent[]>(this.initialAgents);
  agents$ = this.agentsSubject.asObservable();

  // Filter States
  private searchSubject = new BehaviorSubject<string>('');
  private statusSubject = new BehaviorSubject<string>('All');
  private visibilitySubject = new BehaviorSubject<string>('All');
  private sortSubject = new BehaviorSubject<string>('Recently Updated');

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

  setSearch(q: string) {
    this.searchSubject.next(q);
  }

  setStatus(status: string) {
    this.statusSubject.next(status);
  }

  setVisibility(visibility: string) {
    this.visibilitySubject.next(visibility);
  }

  setSort(sort: string) {
    this.sortSubject.next(sort);
  }

  addAgent(newAgent: Omit<Agent, 'id' | 'lastActive'>) {
    const current = this.agentsSubject.value;
    const added: Agent = {
      ...newAgent,
      id: (current.length + 1).toString(),
      lastActive: 'Just now',
    };
    this.agentsSubject.next([added, ...current]);
  }
}
