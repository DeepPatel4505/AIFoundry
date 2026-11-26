import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { McpAddDialogComponent } from './add-dialog';
import { McpService } from '../../services/mcp.service';
import { McpRegistrationDraftService } from '../../services/mcp-registration-draft.service';
import { ToastService } from '@web/shared-ui';

describe('McpAddDialogComponent', () => {
  let component: McpAddDialogComponent;
  let fixture: ComponentFixture<McpAddDialogComponent>;
  let mcpService: McpService;
  let draftService: McpRegistrationDraftService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [McpAddDialogComponent],
      providers: [
        McpService,
        McpRegistrationDraftService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ToastService,
          useValue: {
            show: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(McpAddDialogComponent);
    component = fixture.componentInstance;
    mcpService = TestBed.inject(McpService);
    draftService = TestBed.inject(McpRegistrationDraftService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should restore draft on open', () => {
    draftService.saveDraft({
      name: 'GitHub MCP Draft',
      endpointUrl: 'https://mcp.github.com/mcp',
      transport: 'STREAMABLE_HTTP',
      authType: 'BEARER',
      description: 'Test draft',
      visibility: 'PRIVATE',
      tags: ['github', 'vcs'],
      credentials: { token: 'secret-token-123' },
    });

    component.open();

    expect(component.name).toBe('GitHub MCP Draft');
    expect(component.endpointUrl).toBe('https://mcp.github.com/mcp');
    expect(component.transport).toBe('STREAMABLE_HTTP');
    expect(component.authType).toBe('Bearer Token');
    expect(component.token).toBe('secret-token-123');
    expect(component.visibility).toBe('private');
  });

  it('should discard draft when forgetDraft is called', () => {
    draftService.saveDraft({
      name: 'Temp Draft',
      endpointUrl: 'https://mcp.example.com',
      transport: 'STREAMABLE_HTTP',
      authType: 'NONE',
      description: '',
      visibility: 'PUBLIC',
      tags: [],
    });

    component.open();
    expect(component.name).toBe('Temp Draft');

    component.forgetDraft();
    expect(component.name).toBe('');
    expect(draftService.loadDraft()).toBeNull();
  });

  it('should connect and display discovered metadata preview', () => {
    const mockPreview = {
      serverInfo: { name: 'github-mcp', version: '1.2.0' },
      protocolVersion: '2025-06-18',
      capabilities: { tools: {} },
      tools: [{ name: 'search_repos', description: 'Search repos' }],
      resources: [],
      prompts: [],
    };

    jest.spyOn(mcpService, 'connectMcpServer').mockReturnValue(of(mockPreview));

    component.name = 'GitHub MCP';
    component.endpointUrl = 'https://mcp.github.com';
    component.connect();

    expect(component.isConnected()).toBe(true);
    expect(component.discoveredPreview()).toEqual(mockPreview);
  });

  it('should clear draft upon successful registration', () => {
    draftService.saveDraft({
      name: 'Registered MCP',
      endpointUrl: 'https://mcp.registered.com',
      transport: 'STREAMABLE_HTTP',
      authType: 'NONE',
      description: '',
      visibility: 'PUBLIC',
      tags: [],
    });

    jest.spyOn(mcpService, 'registerMcpServer').mockReturnValue(of({ success: true }));

    component.open();
    component.name = 'Registered MCP';
    component.endpointUrl = 'https://mcp.registered.com';
    component.register();

    expect(draftService.loadDraft()).toBeNull();
    expect(component.isOpen()).toBe(false);
  });
});
