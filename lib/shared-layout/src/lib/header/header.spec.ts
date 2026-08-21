import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedHeaderComponent } from './header';

describe('SharedHeaderComponent', () => {
  let component: SharedHeaderComponent;
  let fixture: ComponentFixture<SharedHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to companyName "Janus Labs"', () => {
    expect(component.companyName).toBe('Janus Labs');
  });

  it('should toggle menu open and closed', () => {
    expect(component.isMenuOpen).toBe(false);
    component.toggleMenu();
    expect(component.isMenuOpen).toBe(true);
    component.toggleMenu();
    expect(component.isMenuOpen).toBe(false);
  });

  it('should get correct initials from userName', () => {
    component.userName = 'Elena Rostova';
    expect(component.getInitials()).toBe('ER');

    component.userName = 'Elena';
    expect(component.getInitials()).toBe('E');

    component.userName = '';
    expect(component.getInitials()).toBe('U');
  });

  it('should emit profileClick, settingsClick, and logoutClick events', () => {
    jest.spyOn(component.profileClick, 'emit');
    jest.spyOn(component.settingsClick, 'emit');
    jest.spyOn(component.logoutClick, 'emit');

    component.onProfileClick();
    expect(component.profileClick.emit).toHaveBeenCalled();
    expect(component.isMenuOpen).toBe(false);

    component.onSettingsClick();
    expect(component.settingsClick.emit).toHaveBeenCalled();

    component.onLogoutClick();
    expect(component.logoutClick.emit).toHaveBeenCalled();
  });
});
