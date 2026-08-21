import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptsService } from '../../services/prompts.service';

@Component({
  selector: 'lib-prompts-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css',
})
export class PromptsFilterPanelComponent implements OnInit {
  searchQuery = '';
  activeVisibility = 'All';

  visibilityOptions = ['All', 'Public', 'Private'];

  constructor(private promptsService: PromptsService) {}

  ngOnInit(): void {}

  onSearchChange(): void {
    this.promptsService.setSearch(this.searchQuery);
  }

  selectVisibility(visibility: string): void {
    this.activeVisibility = visibility;
    this.promptsService.setVisibility(visibility);
  }
}
