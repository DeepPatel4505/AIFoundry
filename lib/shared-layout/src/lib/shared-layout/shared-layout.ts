import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SharedHeaderComponent } from '../header/header';
import { SharedSidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'lib-shared-layout',
  imports: [SharedHeaderComponent, SharedSidebarComponent, RouterOutlet],
  templateUrl: './shared-layout.html',
  styleUrl: './shared-layout.css',
})
export class SharedLayout {
  isSidebarCollapsed = false;

  onSidebarCollapseChange(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }
}

