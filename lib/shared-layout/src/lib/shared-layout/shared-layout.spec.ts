import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SharedLayout } from './shared-layout';

describe('SharedLayout', () => {
  let component: SharedLayout;
  let fixture: ComponentFixture<SharedLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedLayout],
      providers: [provideRouter([])],
    }).compileComponents();


    fixture = TestBed.createComponent(SharedLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
