import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'lib-shared-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SharedSidebarComponent {
  @Input() activePath = 'home';
  @Input() cataloguesExpanded = true;
  @Input() isCollapsed = false;

  @Output() navigate = new EventEmitter<string>();
  @Output() collapseChange = new EventEmitter<boolean>();

  constructor(private router: Router) {}

  isGroupActive(): boolean {
    const url = this.router.url;
    return url.includes('/agents') || url.includes('/mcp') || url.includes('/skills') || url.includes('/prompts');
  }


  toggleCatalogues(): void {
    if (this.isCollapsed) {
      // If sidebar is collapsed, expanding catalogues should expand the sidebar first
      this.isCollapsed = false;
      this.collapseChange.emit(false);
      this.cataloguesExpanded = true;
    } else {
      this.cataloguesExpanded = !this.cataloguesExpanded;
    }
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.collapseChange.emit(this.isCollapsed);
    if (this.isCollapsed) {
      // Typically keep catalogues expanded state in memory but visual subitems will be hidden
    }
  }

  onItemClick(path: string): void {
    this.activePath = path;
    this.navigate.emit(path);
  }
}
