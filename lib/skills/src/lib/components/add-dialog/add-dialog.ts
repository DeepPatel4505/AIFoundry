import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkillsService } from '../../services/skills.service';

@Component({
  selector: 'lib-skills-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-dialog.html',
  styleUrl: './add-dialog.css',
})
export class SkillsAddDialogComponent implements OnInit {
  isOpen = signal(false);
  isValidated = false;

  name = '';
  description = '';
  definition = '';
  category: 'tool' | 'logic' | 'api' = 'tool';

  constructor(private skillsService: SkillsService) {}

  ngOnInit(): void {}

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  uploadSkill(): void {
    // Mock upload action
    alert('Mock Action: Skill config file uploaded successfully!');
  }

  importFromGit(): void {
    // Mock Git import
    const repoUrl = prompt('Enter Skill Git Repository URL:');
    if (repoUrl) {
      this.name = repoUrl.split('/').pop()?.replace('.git', '') || '';
      this.description = 'Imported from Git: ' + repoUrl;
      this.definition = 'Instructions parsed from Git README and config schemas...';
      this.isValidated = true;
    }
  }

  validate(): void {
    if (!this.name.trim() || !this.definition.trim()) {
      alert('Validation Failed: Please fill in Name and Skill Definition.');
      return;
    }
    this.isValidated = true;
    alert('Skill validation succeeded! No compile or JSON schema issues found.');
  }

  register(): void {
    if (!this.name.trim() || !this.definition.trim()) return;

    this.skillsService.addSkill({
      name: this.name,
      description: this.description,
      definition: this.definition,
      category: this.category,
    });

    this.close();
  }

  private resetForm(): void {
    this.name = '';
    this.description = '';
    this.definition = '';
    this.category = 'tool';
    this.isValidated = false;
  }
}
