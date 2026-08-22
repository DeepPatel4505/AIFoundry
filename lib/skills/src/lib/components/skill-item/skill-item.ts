import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Skill } from '../../services/skills.service';
import { ToastService } from '@web/shared-ui';

@Component({
  selector: 'lib-skill-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skill-item.html',
  styleUrl: './skill-item.css',
})
export class SkillItemComponent {
  @Input() skill!: Skill;

  private router = inject(Router);
  private toastService = inject(ToastService);

  openDetail(): void {
    const target = this.skill.slug || this.skill.id;
    this.router.navigate(['/skills', target]);
  }

  copyInstallCommand(event: MouseEvent): void {
    event.stopPropagation();
    const command = `janus skill install ${this.skill.slug || this.skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    navigator.clipboard.writeText(command).then(() => {
      this.toastService.show(`Copied install command: "${command}"`, 'info');
    });
  }
}
