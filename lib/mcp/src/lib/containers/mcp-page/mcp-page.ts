import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { McpService, McpServer } from '../../services/mcp.service';
import { McpCardComponent } from '../../components/mcp-card/mcp-card';
import { Observable } from 'rxjs';

@Component({
  selector: 'lib-mcp-page',
  standalone: true,
  imports: [CommonModule, McpCardComponent],
  templateUrl: './mcp-page.html',
  styleUrl: './mcp-page.css',
})
export class McpPageComponent implements OnInit {
  servers$!: Observable<McpServer[]>;

  constructor(private mcpService: McpService) {}

  ngOnInit(): void {
    this.servers$ = this.mcpService.getMcpServers();
  }
}
