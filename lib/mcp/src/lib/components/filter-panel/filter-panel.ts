import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { McpService } from '../../services/mcp.service';

@Component({
  selector: 'lib-mcp-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css',
})
export class McpFilterPanelComponent implements OnInit {
  searchQuery = '';
  activeVisibility = 'All';

  visibilityOptions = ['All', 'Public', 'Private'];

  constructor(private mcpService: McpService) {}

  ngOnInit(): void {}

  onSearchChange(): void {
    this.mcpService.setSearch(this.searchQuery);
  }

  selectVisibility(visibility: string): void {
    this.activeVisibility = visibility;
    this.mcpService.setVisibility(visibility);
  }
}
