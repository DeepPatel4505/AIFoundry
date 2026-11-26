import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AgentFeatureDetailComponent } from './feature-detail';
import { AgentService, Agent } from '../../services/agent.service';
import { ToastService } from '@web/shared-ui';

describe('AgentFeatureDetailComponent', () => {
  let component: AgentFeatureDetailComponent;
  let fixture: ComponentFixture<AgentFeatureDetailComponent>;
  let agentService: AgentService;
  let toastService: ToastService;

  const mockAgent: Agent = {
    id: '1',
    name: 'sample agent',
    slug: 'sample-agent',
    description: 'Autonomous factual synthesis and multi-source knowledge retrieval agent with A2A protocol negotiation.',
    agentUrl: 'https://api.sampleagent.dev/v1/agent',
    gitRepo: 'https://github.com/janus/sample-agent',
    agentType: 'A2A',
    authMode: 'API Key',
    tags: ['Get Fact', 'General', 'A2A Swarm'],
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
    systemPrompt: 'You are an authoritative research agent.',
    capabilities: [
      {
        name: 'get_fact',
        description: 'Search indexed knowledge graphs and peer agents for factual claims.',
        returns: '{ fact: string, confidenceScore: number }',
        parameters: [
          {
            name: 'query',
            type: 'string',
            description: 'Target subject or specific claim.',
            required: true,
          },
        ],
        example: { query: 'Quantum supremacy benchmarks' },
      },
    ],
    versions: [
      {
        version: '1.2.0',
        releaseDate: 'Oct 12, 2026',
        changelog: 'Added A2A Swarm protocol.',
        isLatest: true,
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentFeatureDetailComponent],
      providers: [
        AgentService,
        ToastService,
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    agentService = TestBed.inject(AgentService);
    toastService = TestBed.inject(ToastService);
    jest.spyOn(agentService, 'getAgentById').mockReturnValue(of(mockAgent));

    fixture = TestBed.createComponent(AgentFeatureDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load agent specifications', () => {
    expect(component).toBeTruthy();
    expect(component.agent()).toEqual(mockAgent);
    expect(component.isLoading()).toBe(false);
    expect(component.isError()).toBe(false);
    expect(component.starCount()).toBe(14);
  });

  it('should toggle star state and update starCount', () => {
    const toastSpy = jest.spyOn(toastService, 'show');
    component.toggleStar();
    expect(component.isStarred()).toBe(true);
    expect(component.starCount()).toBe(15);
    expect(toastSpy).toHaveBeenCalledWith('Agent added to your starred collection!', 'success');

    component.toggleStar();
    expect(component.isStarred()).toBe(false);
    expect(component.starCount()).toBe(14);
  });

  it('should switch tabs properly', () => {
    expect(component.activeTab()).toBe('capabilities');
    component.setTab('integration');
    expect(component.activeTab()).toBe('integration');
    component.setTab('instructions');
    expect(component.activeTab()).toBe('instructions');
  });

  it('should switch integration languages', () => {
    expect(component.selectedLang()).toBe('curl');
    component.selectLang('python');
    expect(component.selectedLang()).toBe('python');
    component.selectLang('typescript');
    expect(component.selectedLang()).toBe('typescript');
    component.selectLang('a2a');
    expect(component.selectedLang()).toBe('a2a');
  });

  it('should filter capabilities based on query', () => {
    expect(component.filteredCapabilities().length).toBe(1);
    component.capabilitySearch.set('nonexistent_tool');
    expect(component.filteredCapabilities().length).toBe(0);
    component.capabilitySearch.set('fact');
    expect(component.filteredCapabilities().length).toBe(1);
  });

  it('should generate valid code snippets for curl, python, typescript, and a2a', () => {
    const curl = component.getCurlSnippet();
    expect(curl).toContain('curl -X POST');
    expect(curl).toContain('https://api.sampleagent.dev/v1/agent');
    expect(curl).toContain('get_fact');

    const python = component.getPythonSnippet();
    expect(python).toContain('import requests');
    expect(python).toContain('get_fact');
    expect(python).toContain('A2A/2.0');

    const ts = component.getTypeScriptSnippet();
    expect(ts).toContain('JanusAgentClient');
    expect(ts).toContain('get_fact');

    const a2a = component.getA2aSnippet();
    expect(a2a).toContain('a2a.negotiate');
    expect(a2a).toContain('a2a.delegate');
  });

  it('should toggle example expansion state', () => {
    expect(component.isExampleExpanded('get_fact')).toBe(false);
    component.toggleExample('get_fact');
    expect(component.isExampleExpanded('get_fact')).toBe(true);
    component.toggleExample('get_fact');
    expect(component.isExampleExpanded('get_fact')).toBe(false);
  });
});
