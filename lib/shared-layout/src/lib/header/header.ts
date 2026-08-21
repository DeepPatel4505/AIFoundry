import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-shared-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class SharedHeaderComponent {
  @Input() companyName = 'Janus Labs';
  @Input() userName = 'Elena Rostova';
  @Input() userRole = 'Senior Architect';
  @Input() userAvatarUrl = ''; // If empty, renders initials

  @Output() profileClick = new EventEmitter<void>();
  @Output() settingsClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  isMenuOpen = false;

  constructor(private elementRef: ElementRef) {}

  toggleMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  onProfileClick(): void {
    this.profileClick.emit();
    this.closeMenu();
  }

  onSettingsClick(): void {
    this.settingsClick.emit();
    this.closeMenu();
  }

  onLogoutClick(): void {
    this.logoutClick.emit();
    this.closeMenu();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeMenu();
  }

  getInitials(): string {
    if (!this.userName) return 'U';
    const parts = this.userName.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
}
