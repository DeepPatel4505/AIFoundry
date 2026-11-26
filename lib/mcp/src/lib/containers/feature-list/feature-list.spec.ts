import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { McpFeatureListComponent } from './feature-list';
import { McpService } from '../../services/mcp.service';

describe('McpFeatureListComponent', () => {
  let component: McpFeatureListComponent;
  let fixture: ComponentFixture<McpFeatureListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McpFeatureListComponent],
      providers: [McpService, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(McpFeatureListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
