import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PromptTemplate } from '../../services/prompts.service';

@Component({
  selector: 'lib-prompt-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './prompt-card.html',
  styleUrl: './prompt-card.css',
})
export class PromptCardComponent {
  @Input() prompt!: PromptTemplate;
}
