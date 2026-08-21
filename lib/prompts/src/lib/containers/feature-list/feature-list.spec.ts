import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PromptsFeatureListComponent } from './feature-list';
import { PromptsService } from '../../services/prompts.service';

describe('PromptsFeatureListComponent', () => {
  let component: PromptsFeatureListComponent;
  let fixture: ComponentFixture<PromptsFeatureListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromptsFeatureListComponent],
      providers: [PromptsService],
    }).compileComponents();

    fixture = TestBed.createComponent(PromptsFeatureListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
