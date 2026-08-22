import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SkillsService, Skill } from '../../services/skills.service';
import { SkillsFilterPanelComponent } from '../../components/filter-panel/filter-panel';
import { SkillsAddDialogComponent } from '../../components/add-dialog/add-dialog';
import { SkillItemComponent } from '../../components/skill-item/skill-item';
import { PaginationComponent } from '@web/shared-ui';

@Component({
  selector: 'lib-skills-feature-list',
  standalone: true,
  imports: [
    CommonModule,
    SkillsFilterPanelComponent,
    SkillsAddDialogComponent,
    SkillItemComponent,
    PaginationComponent
  ],
  templateUrl: './feature-list.html',
  styleUrl: './feature-list.css',
})
export class SkillsFeatureListComponent implements OnInit {
  @ViewChild('addDialog') addDialog!: SkillsAddDialogComponent;

  skills$!: Observable<Skill[]>;
  paginationMetadata$!: Observable<{ page: number; limit: number; total: number; totalPages: number }>;

  constructor(private skillsService: SkillsService) {}

  ngOnInit(): void {
    this.skills$ = this.skillsService.paginatedSkills$;
    this.paginationMetadata$ = this.skillsService.paginationMetadata$;
  }

  onPageChange(page: number): void {
    this.skillsService.setPage(page);
  }

  onPageSizeChange(limit: number): void {
    this.skillsService.setLimit(limit);
  }

  openRegisterModal(): void {
    this.addDialog.open();
  }

  refreshList(): void {
    this.skillsService.refresh();
  }
}
