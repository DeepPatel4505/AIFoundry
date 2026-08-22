import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AgentService, Agent } from '../../services/agent.service';
import { FilterPanelComponent } from '../../components/filter-panel/filter-panel';
import { AddDialogComponent } from '../../components/add-dialog/add-dialog';
import { AgentCardComponent } from '../../components/agent-card/agent-card';
import { PaginationComponent } from '@web/shared-ui';

@Component({
  selector: 'lib-feature-list',
  standalone: true,
  imports: [
    CommonModule,
    FilterPanelComponent,
    AddDialogComponent,
    AgentCardComponent,
    PaginationComponent
  ],
  templateUrl: './feature-list.html',
  styleUrl: './feature-list.css',
})
export class FeatureListComponent implements OnInit {
  @ViewChild('addDialog') addDialog!: AddDialogComponent;

  agents$!: Observable<Agent[]>;
  paginationMetadata$!: Observable<{ page: number; limit: number; total: number; totalPages: number }>;

  constructor(private agentService: AgentService) {}

  ngOnInit(): void {
    this.agents$ = this.agentService.paginatedAgents$;
    this.paginationMetadata$ = this.agentService.paginationMetadata$;
  }

  onPageChange(page: number): void {
    this.agentService.setPage(page);
  }

  onPageSizeChange(limit: number): void {
    this.agentService.setLimit(limit);
  }

  openRegisterModal(): void {
    this.addDialog.open();
  }

  refreshList(): void {
    // Simply reset search to refresh view
    this.agentService.setSearch('');
  }
}
