import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { PromptsService, PromptTemplate } from '../../services/prompts.service';
import { PromptsFilterPanelComponent } from '../../components/filter-panel/filter-panel';
import { PromptsAddDialogComponent } from '../../components/add-dialog/add-dialog';
import { PromptCardComponent } from '../../components/prompt-card/prompt-card';
import { PaginationComponent } from '@web/shared-ui';

@Component({
  selector: 'lib-prompts-feature-list',
  standalone: true,
  imports: [
    CommonModule,
    PromptsFilterPanelComponent,
    PromptsAddDialogComponent,
    PromptCardComponent,
    PaginationComponent
  ],
  templateUrl: './feature-list.html',
  styleUrl: './feature-list.css',
})
export class PromptsFeatureListComponent implements OnInit {
  @ViewChild('addDialog') addDialog!: PromptsAddDialogComponent;

  prompts$!: Observable<PromptTemplate[]>;
  paginationMetadata$!: Observable<{ page: number; limit: number; total: number; totalPages: number }>;

  constructor(private promptsService: PromptsService) {}

  ngOnInit(): void {
    this.prompts$ = this.promptsService.filteredPrompts$;
    this.paginationMetadata$ = this.promptsService.paginationMetadata$;
  }

  onPageChange(page: number): void {
    this.promptsService.setPage(page);
  }

  onPageSizeChange(limit: number): void {
    this.promptsService.setLimit(limit);
  }

  openRegisterModal(): void {
    this.addDialog.open();
  }

  refreshList(): void {
    this.promptsService.setSearch('');
    this.promptsService.setVisibility('All');
  }
}
