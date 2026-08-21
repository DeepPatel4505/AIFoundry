import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SkillsService, Skill } from '../../services/skills.service';
import { SkillsFilterPanelComponent } from '../../components/filter-panel/filter-panel';
import { SkillsAddDialogComponent } from '../../components/add-dialog/add-dialog';
import { SkillItemComponent } from '../../components/skill-item/skill-item';

@Component({
  selector: 'lib-skills-feature-list',
  standalone: true,
  imports: [CommonModule, SkillsFilterPanelComponent, SkillsAddDialogComponent, SkillItemComponent],
  templateUrl: './feature-list.html',
  styleUrl: './feature-list.css',
})
export class SkillsFeatureListComponent implements OnInit {
  @ViewChild('addDialog') addDialog!: SkillsAddDialogComponent;

  skills$!: Observable<Skill[]>;

  constructor(private skillsService: SkillsService) {}

  ngOnInit(): void {
    this.skills$ = this.skillsService.filteredSkills$;
  }

  openRegisterModal(): void {
    this.addDialog.open();
  }

  refreshList(): void {
    this.skillsService.setSearch('');
  }
}
