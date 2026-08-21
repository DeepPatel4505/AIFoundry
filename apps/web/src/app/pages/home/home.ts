import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">Workspace Overview</h1>
      <p class="page-subtitle">Welcome back. Here is the operational status of your agent network.</p>
    </div>

    <div class="stats-grid" *ngIf="stats$ | async as stats">
      <!-- Card 1 -->
      <div class="stats-card">
        <div class="card-glow-indigo"></div>
        <div class="stats-header">
          <span class="stats-label">Autonomous Agents</span>
          <span class="stats-badge active">{{ stats.activeAgents }}/{{ stats.agentsCount }} Active</span>
        </div>
        <div class="stats-value">{{ stats.agentsCount }}</div>
        <div class="stats-sub text-muted">Running AI agents and workers</div>
      </div>

      <!-- Card 2 -->
      <div class="stats-card">
        <div class="card-glow-purple"></div>
        <div class="stats-header">
          <span class="stats-label">MCP Connectors</span>
          <span class="stats-badge success">{{ stats.connectedServers }}/{{ stats.serversCount }} Connected</span>
        </div>
        <div class="stats-value">{{ stats.serversCount }}</div>
        <div class="stats-sub text-muted">Model Context Protocol endpoints</div>
      </div>

      <!-- Card 3 -->
      <div class="stats-card">
        <div class="stats-header">
          <span class="stats-label">Tool Skills</span>
          <span class="stats-badge info">Standard</span>
        </div>
        <div class="stats-value">{{ stats.skillsCount }}</div>
        <div class="stats-sub text-muted">Registered capabilities & APIs</div>
      </div>

      <!-- Card 4 -->
      <div class="stats-card">
        <div class="stats-header">
          <span class="stats-label">Prompt Templates</span>
          <span class="stats-badge info">Active</span>
        </div>
        <div class="stats-value">{{ stats.promptsCount }}</div>
        <div class="stats-sub text-muted">Stored system configurations</div>
      </div>
    </div>

    <div class="content-row">
      <div class="info-panel">
        <h2>System Architecture</h2>
        <p>The Janus Enterprise console connects your LLM nodes to local capabilities via <strong>Model Context Protocol (MCP)</strong>. This workspace is customized for high-security sandbox operations, providing standard system tooling, secure databases, and execution runtimes to agents.</p>
        <div class="features-list">
          <div class="feature-item">
            <span class="feature-bullet indigo"></span>
            <div>
              <strong>Secure Execution:</strong> All files are handled under internal Docker sandbox systems.
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-bullet purple"></span>
            <div>
              <strong>Adaptive Tooling:</strong> Add custom capabilities by dropping schema-compliant API connectors into the server registry.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 32px;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .page-subtitle {
      color: #94a3b8;
      font-size: 0.95rem;
      margin: 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stats-card {
      position: relative;
      background: rgba(30, 41, 59, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .stats-card:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.12);
      box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.4);
    }
    .card-glow-indigo, .card-glow-purple {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      filter: blur(40px);
      opacity: 0.2;
    }
    .card-glow-indigo { background: #6366f1; }
    .card-glow-purple { background: #a855f7; }
    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .stats-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stats-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 12px;
      text-transform: uppercase;
    }
    .stats-badge.active {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .stats-badge.success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .stats-badge.info {
      background: rgba(148, 163, 184, 0.15);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .stats-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 4px;
    }
    .stats-sub {
      font-size: 0.75rem;
      color: #64748b;
    }
    .content-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .info-panel {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 20px;
      padding: 32px;
      backdrop-filter: blur(10px);
    }
    .info-panel h2 {
      font-size: 1.35rem;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 12px;
      color: #f1f5f9;
    }
    .info-panel p {
      color: #94a3b8;
      line-height: 1.6;
      font-size: 0.95rem;
      margin-bottom: 24px;
    }
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 0.9rem;
      color: #cbd5e1;
    }
    .feature-bullet {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }
    .feature-bullet.indigo { background: #6366f1; box-shadow: 0 0 8px #6366f1; }
    .feature-bullet.purple { background: #a855f7; box-shadow: 0 0 8px #a855f7; }
  `]
})
export class HomeComponent implements OnInit {
  stats$!: Observable<any>;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.stats$ = this.dataService.getHomeStats();
  }
}
