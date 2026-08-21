import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkillsService } from '../../services/skills.service';

@Component({
  selector: 'lib-skills-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.html',
  styleUrl: './filter-panel.css',
})
export class SkillsFilterPanelComponent implements OnInit {
  searchQuery = '';
  activeCategory = 'All';

  categoryOptions = ['All', 'Tool', 'Logic', 'API'];

  constructor(private skillsService: SkillsService) {}

  ngOnInit(): void {}

  onSearchChange(): void {
    this.skillsService.setSearch(this.searchQuery);
  }

  selectCategory(category: string): void {
    this.activeCategory = category;
    this.skillsService.setCategory(category);
  }
}
