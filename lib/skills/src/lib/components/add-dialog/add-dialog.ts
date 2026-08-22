import { Component, ElementRef, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkillsService } from '../../services/skills.service';
import { ToastService } from '@web/shared-ui';

@Component({
  selector: 'lib-skills-add-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-dialog.html',
  styleUrl: './add-dialog.css',
})
export class SkillsAddDialogComponent implements OnInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('folderInput') folderInputRef!: ElementRef<HTMLInputElement>;

  isOpen = signal(false);
  isValidated = false;
  isSubmitting = false;

  name = '';
  description = '';
  definition = '';
  category: 'tool' | 'logic' | 'api' = 'tool';
  loadedFileName = '';

  constructor(
    private skillsService: SkillsService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  open(): void {
    this.isOpen.set(true);
    this.resetForm();
  }

  close(): void {
    this.isOpen.set(false);
    this.resetForm();
  }

  triggerFileUpload(): void {
    if (this.fileInputRef && this.fileInputRef.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
      this.fileInputRef.nativeElement.click();
    }
  }

  triggerFolderUpload(): void {
    if (this.folderInputRef && this.folderInputRef.nativeElement) {
      this.folderInputRef.nativeElement.value = '';
      this.folderInputRef.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    // 1. If Markdown file (SKILL.md or any .md file)
    if (file.name.toLowerCase().endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          this.definition = text;
          this.loadedFileName = file.name;

          // Infer skill name from first markdown header '# Title' if not already entered
          if (!this.name.trim()) {
            const headingMatch = text.match(/^#\s+(.+)$/m);
            if (headingMatch && headingMatch[1]) {
              this.name = headingMatch[1].trim();
            } else {
              this.name = file.name.replace(/\.md$/i, '').replace(/[-_]+/g, ' ');
            }
          }
          this.toastService.show(`Loaded "${file.name}" into editor!`, 'success');
        }
      };
      reader.readAsText(file);
      return;
    }

    // 2. If ZIP package archive
    if (file.name.toLowerCase().endsWith('.zip')) {
      const formData = new FormData();
      formData.append('file', file);
      if (this.name.trim()) formData.append('name', this.name.trim());
      if (this.description.trim()) formData.append('description', this.description.trim());
      formData.append('category', this.category);

      this.isSubmitting = true;
      this.skillsService.uploadSkillPackage(formData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.show('Skill package uploaded and registered successfully!', 'success');
          this.close();
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.error?.message || 'Failed to upload skill package.';
          this.toastService.show(msg, 'error');
        },
      });
      return;
    }

    this.toastService.show('Please select a SKILL.md file or a .zip package archive.', 'error');
  }

  onFolderSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();

    // Infer name from folder if empty
    let inferredFolderName = '';
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = (file as any).webkitRelativePath || file.name;
      formData.append('files', file, relativePath);

      if (!inferredFolderName && relativePath.includes('/')) {
        inferredFolderName = relativePath.split('/')[0];
      }
    }

    const finalName = this.name.trim() || inferredFolderName.replace(/[-_]+/g, ' ') || 'Folder Skill';
    formData.append('name', finalName);
    if (this.description.trim()) formData.append('description', this.description.trim());
    formData.append('category', this.category);

    this.isSubmitting = true;
    this.toastService.show(`Packaging and uploading folder "${finalName}"...`, 'info');

    this.skillsService.uploadSkillPackage(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.show('Skill folder uploaded and registered successfully!', 'success');
        this.close();
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.error?.message || 'Failed to upload skill folder. Ensure it contains SKILL.md.';
        this.toastService.show(msg, 'error');
      },
    });
  }

  importFromGit(): void {
    const repoUrl = prompt('Enter Skill Git Repository URL (e.g. https://github.com/org/skill):');
    if (!repoUrl || !repoUrl.trim()) return;

    const inferredName = this.name.trim() || repoUrl.split('/').pop()?.replace('.git', '') || 'Git Skill';

    this.isSubmitting = true;
    this.skillsService
      .importGitSkill({
        repositoryUrl: repoUrl.trim(),
        name: inferredName,
        description: this.description.trim() || undefined,
        category: this.category,
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.toastService.show('Git import queued! Processing repository in background.', 'success');
          this.close();

          if (res?.data?.jobId) {
            const interval = setInterval(() => {
              this.skillsService.getJobStatus(res.data.jobId).subscribe({
                next: (jobRes) => {
                  if (jobRes?.data?.status === 'COMPLETED') {
                    clearInterval(interval);
                    this.toastService.show('Git skill import completed!', 'success');
                    this.skillsService.refresh();
                  } else if (jobRes?.data?.status === 'FAILED') {
                    clearInterval(interval);
                    this.toastService.show(`Git import failed: ${jobRes.data.error || 'Unknown error'}`, 'error');
                  }
                },
                error: () => clearInterval(interval),
              });
            }, 2000);
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = err.error?.error?.message || 'Failed to trigger Git import.';
          this.toastService.show(msg, 'error');
        },
      });
  }

  validate(): void {
    if (!this.name.trim() || !this.definition.trim()) {
      this.toastService.show('Please fill in Name and Skill Definition to validate.', 'error');
      return;
    }

    this.skillsService
      .validateSkill({
        name: this.name,
        skillDefinition: this.definition,
        category: this.category,
      })
      .subscribe({
        next: (res) => {
          if (res?.valid) {
            this.isValidated = true;
            this.toastService.show('Skill specification is valid and ready!', 'success');
          } else {
            this.isValidated = false;
            const errorMsg = res?.errors?.[0]?.message || 'Skill specification contains errors.';
            this.toastService.show(`Validation Failed: ${errorMsg}`, 'error');
          }
        },
        error: () => {
          this.isValidated = false;
          this.toastService.show('Validation request failed.', 'error');
        },
      });
  }

  register(): void {
    if (!this.name.trim() || !this.definition.trim()) return;

    this.isSubmitting = true;
    this.skillsService
      .addSkill({
        name: this.name.trim(),
        description: this.description.trim() || undefined,
        definition: this.definition.trim(),
        category: this.category,
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.show(`Skill "${this.name}" registered successfully!`, 'success');
          this.close();
        },
        error: (err: any) => {
          this.isSubmitting = false;
          const msg = err?.error?.error?.message || 'Failed to register skill.';
          this.toastService.show(msg, 'error');
        },
      });
  }

  private resetForm(): void {
    this.name = '';
    this.description = '';
    this.definition = '';
    this.category = 'tool';
    this.loadedFileName = '';
    this.isValidated = false;
    this.isSubmitting = false;
  }
}
