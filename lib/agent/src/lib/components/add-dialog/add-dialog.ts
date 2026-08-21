import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentService } from '../../services/agent.service';

@Component({
  selector: 'lib-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-dialog.html',
  styleUrl: './add-dialog.css',
})
export class AddDialogComponent implements OnInit {
  isOpen = signal(false);

  // Form Fields
  name = '';
  agentUrl = '';
  gitRepo = '';
  description = '';
  agentType = 'A2A';
  authMode = 'None';
  tagsInput = '';
  visibility: 'public' | 'private' = 'public';
  docsLink = '';

  constructor(private agentService: AgentService) {}

  ngOnInit(): void {}

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  register(): void {
    if (!this.name.trim()) return;

    const tags = this.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    this.agentService.addAgent({
      name: this.name,
      description: this.description,
      agentUrl: this.agentUrl || undefined,
      gitRepo: this.gitRepo || undefined,
      agentType: this.agentType,
      authMode: this.authMode,
      tags: tags.length > 0 ? tags : ['General'],
      docsLink: this.docsLink || undefined,
      status: 'active', // default status
      stars: 0, // default rating stars
      isPublic: this.visibility === 'public',
    });

    this.close();
  }

  private resetForm(): void {
    this.name = '';
    this.agentUrl = '';
    this.gitRepo = '';
    this.description = '';
    this.agentType = 'A2A';
    this.authMode = 'None';
    this.tagsInput = '';
    this.visibility = 'public';
    this.docsLink = '';
  }
}
