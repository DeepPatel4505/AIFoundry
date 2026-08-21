import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Skill } from '../../services/skills.service';

@Component({
  selector: 'lib-skill-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-item.html',
  styleUrl: './skill-item.css',
})
export class SkillItemComponent {
  @Input() skill!: Skill;
}
