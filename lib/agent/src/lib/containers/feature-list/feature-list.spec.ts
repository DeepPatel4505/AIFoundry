import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FeatureListComponent } from './feature-list';
import { AgentService } from '../../services/agent.service';

describe('FeatureListComponent', () => {
  let component: FeatureListComponent;
  let fixture: ComponentFixture<FeatureListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureListComponent],
      providers: [AgentService, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
