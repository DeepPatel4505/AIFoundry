import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SharedSidebarComponent } from './sidebar';

describe('SharedSidebarComponent', () => {
  let component: SharedSidebarComponent;
  let fixture: ComponentFixture<SharedSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedSidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();


    fixture = TestBed.createComponent(SharedSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to activePath "home" and expanded catalogues', () => {
    expect(component.activePath).toBe('home');
    expect(component.cataloguesExpanded).toBe(true);
    expect(component.isCollapsed).toBe(false);
  });

  it('should toggle cataloguesExpanded', () => {
    component.isCollapsed = false;
    component.cataloguesExpanded = true;
    component.toggleCatalogues();
    expect(component.cataloguesExpanded).toBe(false);
    component.toggleCatalogues();
    expect(component.cataloguesExpanded).toBe(true);
  });

  it('should expand sidebar if catalogues is clicked while collapsed', () => {
    jest.spyOn(component.collapseChange, 'emit');
    component.isCollapsed = true;
    component.cataloguesExpanded = false;

    component.toggleCatalogues();
    expect(component.isCollapsed).toBe(false);
    expect(component.cataloguesExpanded).toBe(true);
    expect(component.collapseChange.emit).toHaveBeenCalledWith(false);
  });

  it('should toggle sidebar collapse', () => {
    jest.spyOn(component.collapseChange, 'emit');
    expect(component.isCollapsed).toBe(false);
    component.toggleCollapse();
    expect(component.isCollapsed).toBe(true);
    expect(component.collapseChange.emit).toHaveBeenCalledWith(true);
  });

  it('should emit navigate event when onItemClick is triggered', () => {
    jest.spyOn(component.navigate, 'emit');
    component.onItemClick('agents');
    expect(component.activePath).toBe('agents');
    expect(component.navigate.emit).toHaveBeenCalledWith('agents');
  });
});
