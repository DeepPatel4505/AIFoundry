import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentService, Agent } from '../../services/agent.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css',
})
export class FilterPanelComponent implements OnInit {
  searchQuery = '';
  activeStatus = 'All';
  activeVisibility = 'All';
  activeSort = 'Recently Updated';

  statusOptions = ['All', 'Drafts', 'Needs Attention'];
  visibilityOptions = ['All', 'Public', 'Private'];
  sortOptions = ['Recently Updated', 'Recently Created', 'Name (A-Z)', 'Most Popular'];

  needsAttentionCount$: Observable<number>;

  constructor(private agentService: AgentService) {
    this.needsAttentionCount$ = this.agentService.agents$.pipe(
      map((agents) => agents.filter((a) => a.status === 'needs_attention').length)
    );
  }

  ngOnInit(): void {}

  onSearchChange(): void {
    this.agentService.setSearch(this.searchQuery);
  }

  selectStatus(status: string): void {
    this.activeStatus = status;
    this.agentService.setStatus(status);
  }

  selectVisibility(visibility: string): void {
    this.activeVisibility = visibility;
    this.agentService.setVisibility(visibility);
  }

  selectSort(sort: string): void {
    this.activeSort = sort;
    this.agentService.setSort(sort);
  }
}
