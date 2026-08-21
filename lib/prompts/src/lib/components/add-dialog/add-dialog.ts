import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptsService, PromptVariable } from '../../services/prompts.service';

@Component({
  selector: 'lib-prompts-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-dialog.html',
  styleUrl: './add-dialog.css',
})
export class PromptsAddDialogComponent implements OnInit {
  isOpen = signal(false);
  currentStep = 1;

  // Step 1 Fields
  name = '';
  description = '';
  visibility: 'public' | 'private' = 'public';
  tagsInput = '';

  // Step 2 Fields
  template = '';
  detectedVars: PromptVariable[] = [];
  changeLog = 'Initial version';

  // Step 3 Fields
  model = 'Gemini 2.0 Flash';
  maxTokens = 2048;
  temperature = 0.7;

  constructor(private promptsService: PromptsService) {}

  ngOnInit(): void {}

  open(): void {
    this.isOpen.set(true);
    this.currentStep = 1;
  }

  close(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  insertVariable(): void {
    const defaultPlaceholder = '{{variable}}';
    this.template += ' ' + defaultPlaceholder;
    this.parseVariables();
  }

  parseVariables(): void {
    const regex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
    const foundNames: string[] = [];
    let match;
    while ((match = regex.exec(this.template)) !== null) {
      const varName = match[1].trim();
      if (!foundNames.includes(varName)) {
        foundNames.push(varName);
      }
    }

    // Preserve descriptions for existing variables
    this.detectedVars = foundNames.map((name) => {
      const existing = this.detectedVars.find((v) => v.name === name);
      return {
        name,
        description: existing ? existing.description : '',
      };
    });
  }

  register(): void {
    if (!this.name.trim() || !this.template.trim()) return;

    const tags = this.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    this.promptsService.addPrompt({
      name: this.name,
      description: this.description,
      template: this.template,
      tags: tags.length > 0 ? tags : ['General'],
      isPublic: this.visibility === 'public',
      variables: this.detectedVars,
      changeLog: this.changeLog || undefined,
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
    });

    this.close();
  }

  private resetForm(): void {
    this.currentStep = 1;
    this.name = '';
    this.description = '';
    this.visibility = 'public';
    this.tagsInput = '';
    this.template = '';
    this.detectedVars = [];
    this.changeLog = 'Initial version';
    this.model = 'Gemini 2.0 Flash';
    this.maxTokens = 2048;
    this.temperature = 0.7;
  }
}
