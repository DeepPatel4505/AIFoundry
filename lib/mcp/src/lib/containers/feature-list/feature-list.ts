import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { McpService, McpServer } from '../../services/mcp.service';
import { McpFilterPanelComponent } from '../../components/filter-panel/filter-panel';
import { McpAddDialogComponent } from '../../components/add-dialog/add-dialog';
import { McpCardComponent } from '../../components/mcp-card/mcp-card';
import { PaginationComponent } from '@web/shared-ui';

@Component({
  selector: 'lib-mcp-feature-list',
  standalone: true,
  imports: [
    CommonModule,
    McpFilterPanelComponent,
    McpAddDialogComponent,
    McpCardComponent,
    PaginationComponent
  ],
  templateUrl: './feature-list.html',
  styleUrl: './feature-list.css',
})
export class McpFeatureListComponent implements OnInit {
  @ViewChild('addDialog') addDialog!: McpAddDialogComponent;

  servers$!: Observable<McpServer[]>;
  paginationMetadata$!: Observable<{ page: number; limit: number; total: number; totalPages: number }>;

  constructor(private mcpService: McpService) {}

  ngOnInit(): void {
    this.servers$ = this.mcpService.paginatedServers$;
    this.paginationMetadata$ = this.mcpService.paginationMetadata$;
  }

  onPageChange(page: number): void {
    this.mcpService.setPage(page);
  }

  onPageSizeChange(limit: number): void {
    this.mcpService.setLimit(limit);
  }

  openRegisterModal(): void {
    this.addDialog.open();
  }

  refreshList(): void {
    this.mcpService.setSearch('');
    this.mcpService.setVisibility('All');
  }
}
