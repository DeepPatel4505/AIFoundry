import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Agent } from '../../services/agent.service';

@Component({
  selector: 'lib-agent-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './agent-card.html',
  styleUrl: './agent-card.css',
})
export class AgentCardComponent {
  @Input() agent!: Agent;
}
