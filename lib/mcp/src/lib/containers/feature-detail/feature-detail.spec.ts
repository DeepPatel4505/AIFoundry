import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { McpFeatureDetailComponent } from './feature-detail';
import { McpService } from '../../services/mcp.service';
import { ToastService } from '@web/shared-ui';

describe('McpFeatureDetailComponent', () => {
  let component: McpFeatureDetailComponent;
  let fixture: ComponentFixture<McpFeatureDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McpFeatureDetailComponent],
      providers: [
        McpService,
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (key: string) => (key === 'id' ? 'm1' : null),
            }),
          },
        },
        {
          provide: ToastService,
          useValue: {
            show: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(McpFeatureDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load server details for m1', () => {
    expect(component.server()).toBeTruthy();
    expect(component.server()?.name).toBe('Local Filesystem MCP');
  });

  it('should toggle between ides and tools tabs', () => {
    expect(component.activeTab()).toBe('ides');
    component.setTab('tools');
    expect(component.activeTab()).toBe('tools');
  });

  it('should change selected IDE and generate valid JSON config', () => {
    component.selectIde('cursor');
    expect(component.selectedIde()).toBe('cursor');
    const cursorConfig = component.getIdeConfigSnippet();
    expect(cursorConfig).toContain('mcpServers');

    component.selectIde('zed');
    expect(component.selectedIde()).toBe('zed');
    const zedConfig = component.getIdeConfigSnippet();
    expect(zedConfig).toContain('context_servers');
  });

  it('should filter tools by query', () => {
    expect(component.filteredTools().length).toBeGreaterThan(0);
    component.toolSearch.set('read_file');
    const results = component.filteredTools();
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('read_file');
  });
});
