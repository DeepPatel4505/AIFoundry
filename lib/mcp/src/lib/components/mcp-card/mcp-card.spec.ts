import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { McpCardComponent } from './mcp-card';
import { McpServer } from '../../services/mcp.service';

describe('McpCardComponent', () => {
  let component: McpCardComponent;
  let fixture: ComponentFixture<McpCardComponent>;

  const baseServer: McpServer = {
    id: 'mcp-1',
    name: 'GitHub MCP Server',
    description: 'Enables tool invocation for GitHub repositories.',
    url: 'https://api.github.com/mcp',
    status: 'connected',
    authType: 'Bearer',
    tags: ['git', 'code'],
    isPublic: true,
    capabilities: ['search_repositories', 'get_file_contents', 'create_issue', 'merge_pull_request'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McpCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(McpCardComponent);
    component = fixture.componentInstance;
    component.server = { ...baseServer };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show all tools when capabilities count is <= 5', () => {
    component.server = {
      ...baseServer,
      capabilities: ['tool_1', 'tool_2', 'tool_3', 'tool_4', 'tool_5'],
    };
    fixture.detectChanges();

    expect(component.visibleCapabilities).toEqual(['tool_1', 'tool_2', 'tool_3', 'tool_4', 'tool_5']);
    expect(component.remainingCount).toBe(0);
    expect(component.remainingTooltip).toBe('');

    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.cap-bullet-item:not(.cap-more-badge)');
    expect(items.length).toBe(5);

    const moreBadge = el.querySelector('.cap-more-badge');
    expect(moreBadge).toBeNull();
  });

  it('should show 4 tools and a +n more badge when capabilities count is > 5', () => {
    component.server = {
      ...baseServer,
      capabilities: ['tool_1', 'tool_2', 'tool_3', 'tool_4', 'tool_5', 'tool_6', 'tool_7'],
    };
    fixture.detectChanges();

    expect(component.visibleCapabilities).toEqual(['tool_1', 'tool_2', 'tool_3', 'tool_4']);
    expect(component.remainingCount).toBe(3);
    expect(component.remainingTooltip).toBe('tool_5, tool_6, tool_7');

    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.cap-bullet-item:not(.cap-more-badge)');
    expect(items.length).toBe(4);

    const moreBadge = el.querySelector('.cap-more-badge');
    expect(moreBadge).not.toBeNull();
    expect(moreBadge?.textContent?.trim()).toBe('+3 more');
    expect(moreBadge?.getAttribute('title')).toBe('tool_5, tool_6, tool_7');
  });

  it('should handle empty capabilities safely', () => {
    component.server = {
      ...baseServer,
      capabilities: [],
    };
    fixture.detectChanges();

    expect(component.visibleCapabilities).toEqual([]);
    expect(component.remainingCount).toBe(0);
    expect(component.remainingTooltip).toBe('');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.capabilities-block')).toBeNull();
  });
});
