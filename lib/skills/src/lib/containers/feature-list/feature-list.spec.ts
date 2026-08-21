import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkillsFeatureListComponent } from './feature-list';
import { SkillsService } from '../../services/skills.service';

describe('SkillsFeatureListComponent', () => {
  let component: SkillsFeatureListComponent;
  let fixture: ComponentFixture<SkillsFeatureListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillsFeatureListComponent],
      providers: [SkillsService],
    }).compileComponents();

    fixture = TestBed.createComponent(SkillsFeatureListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
