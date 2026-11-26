import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { McpServer } from '../../services/mcp.service';

@Component({
  selector: 'lib-mcp-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mcp-card.html',
  styleUrl: './mcp-card.css',
})
export class McpCardComponent {
  @Input() server!: McpServer;

  readonly MAX_VISIBLE_TOOLS = 4;

  get visibleCapabilities(): string[] {
    if (!this.server?.capabilities) return [];
    if (this.server.capabilities.length <= 5) {
      return this.server.capabilities;
    }
    return this.server.capabilities.slice(0, 4);
  }

  get remainingCount(): number {
    if (!this.server?.capabilities) return 0;
    const total = this.server.capabilities.length;
    const visible = this.visibleCapabilities.length;
    return total > visible ? total - visible : 0;
  }

  get remainingTooltip(): string {
    if (!this.server?.capabilities || this.remainingCount <= 0) return '';
    return this.server.capabilities.slice(this.visibleCapabilities.length).join(', ');
  }
}
