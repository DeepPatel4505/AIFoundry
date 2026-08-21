import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McpServer } from '../../services/mcp.service';

@Component({
  selector: 'lib-mcp-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mcp-card.html',
  styleUrl: './mcp-card.css',
})
export class McpCardComponent {
  @Input() server!: McpServer;
}
