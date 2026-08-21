import { ComponentFixture, TestBed } from '@angular/core/testing';
import { McpPageComponent } from './mcp-page';
import { McpService } from '../../services/mcp.service';

describe('McpPageComponent', () => {
  let component: McpPageComponent;
  let fixture: ComponentFixture<McpPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McpPageComponent],
      providers: [McpService],
    }).compileComponents();

    fixture = TestBed.createComponent(McpPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
