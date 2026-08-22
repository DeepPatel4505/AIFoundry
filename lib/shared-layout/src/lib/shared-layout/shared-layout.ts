import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SharedHeaderComponent } from '../header/header';
import { SharedSidebarComponent } from '../sidebar/sidebar';
import { ToastContainerComponent } from '@web/shared-ui';
import { AuthService } from '@web/auth';

@Component({
  selector: 'lib-shared-layout',
  imports: [CommonModule, SharedHeaderComponent, SharedSidebarComponent, RouterOutlet, ToastContainerComponent],
  templateUrl: './shared-layout.html',
  styleUrl: './shared-layout.css',
})
export class SharedLayout {
  isSidebarCollapsed = false;
  user$;

  constructor(private authService: AuthService, private router: Router) {
    this.user$ = this.authService.currentUser$;
  }

  onSidebarCollapseChange(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

  onProfileClick(): void {
    this.router.navigate(['/profile']);
  }

  onLogoutClick(): void {
    this.authService.logout().subscribe();
  }
}

