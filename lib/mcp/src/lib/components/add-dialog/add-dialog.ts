import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { McpService } from '../../services/mcp.service';

@Component({
  selector: 'lib-mcp-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-dialog.html',
  styleUrl: './add-dialog.css',
})
export class McpAddDialogComponent implements OnInit {
  isOpen = signal(false);
  currentStep = signal(1);

  // Step 1 Fields
  name = '';
  url = '';
  authType = 'None';
  isConnected = signal(false);
  isConnecting = signal(false);

  // Step 2 Fields
  description = '';
  tagsInput = '';
  visibility: 'public' | 'private' = 'public';

  constructor(private mcpService: McpService) {}

  ngOnInit(): void {}

  open(): void {
    this.isOpen.set(true);
    this.currentStep.set(1);
  }

  close(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  connect(): void {
    if (!this.name.trim() || !this.url.trim()) return;

    this.isConnecting.set(true);

    // Simulate mock server connection check
    setTimeout(() => {
      this.isConnecting.set(false);
      this.isConnected.set(true);
    }, 2000);
  }

  nextStep(): void {
    if (this.currentStep() < 2 && this.isConnected()) {
      this.currentStep.set(2);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(1);
    }
  }

  register(): void {
    if (!this.name.trim() || !this.url.trim()) return;

    const tags = this.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    this.mcpService.addMcpServer({
      name: this.name,
      description: this.description,
      url: this.url,
      authType: this.authType,
      tags: tags.length > 0 ? tags : ['General'],
      isPublic: this.visibility === 'public',
    });

    this.close();
  }

  private resetForm(): void {
    this.currentStep.set(1);
    this.name = '';
    this.url = '';
    this.authType = 'None';
    this.isConnected.set(false);
    this.isConnecting.set(false);
    this.description = '';
    this.tagsInput = '';
    this.visibility = 'public';
  }
}
