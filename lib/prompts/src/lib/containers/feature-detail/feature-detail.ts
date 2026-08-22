import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PromptsService, PromptTemplate } from '../../services/prompts.service';
import { ToastService } from '@web/shared-ui';

@Component({
  selector: 'lib-prompts-feature-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './feature-detail.html',
  styleUrl: './feature-detail.css',
})
export class PromptsFeatureDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private promptsService = inject(PromptsService);
  private toastService = inject(ToastService);

  prompt = signal<any>(null);
  isLoading = signal(true);
  isError = signal(false);

  // Star state
  isStarred = signal(false);
  starCount = signal(0);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadPromptDetails(id);
      } else {
        this.isError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  private loadPromptDetails(id: string): void {
    this.isLoading.set(true);
    this.isError.set(false);

    this.promptsService.getPrompt(id).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const data = res.data;
          this.prompt.set(data);

          // Star count and state loading (localStorage based for visual persistence)
          const localStarKey = `janus-prompt-starred-${data.id}`;
          const localIsStarred = localStorage.getItem(localStarKey) === 'true';
          this.isStarred.set(localIsStarred);
          
          // Use stars from registry item or custom random count for mock visual realism
          const baseStars = data.stars !== undefined ? data.stars : Math.floor(Math.random() * 25) + 5;
          this.starCount.set(localIsStarred ? baseStars + 1 : baseStars);
        } else {
          this.isError.set(true);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load prompt details:', err);
        this.isError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  copyContent(): void {
    const data = this.prompt();
    if (!data || !data.latestVersion || !data.latestVersion.content) {
      this.toastService.show('No content to copy!', 'error');
      return;
    }

    navigator.clipboard.writeText(data.latestVersion.content).then(
      () => {
        this.toastService.show('Prompt content copied to clipboard!', 'success');
      },
      (err) => {
        console.error('Failed to copy prompt content:', err);
        this.toastService.show('Failed to copy to clipboard.', 'error');
      }
    );
  }

  shareUrl(): void {
    const shareLink = window.location.href;
    navigator.clipboard.writeText(shareLink).then(
      () => {
        this.toastService.show('Prompt share link copied to clipboard!', 'success');
      },
      (err) => {
        console.error('Failed to copy URL:', err);
        this.toastService.show('Failed to copy link.', 'error');
      }
    );
  }

  toggleStar(): void {
    const data = this.prompt();
    if (!data) return;

    const localStarKey = `janus-prompt-starred-${data.id}`;
    const nextStarred = !this.isStarred();
    
    this.isStarred.set(nextStarred);
    localStorage.setItem(localStarKey, String(nextStarred));

    if (nextStarred) {
      this.starCount.update((count) => count + 1);
      this.toastService.show('Added prompt to starred list!', 'success');
    } else {
      this.starCount.update((count) => Math.max(0, count - 1));
      this.toastService.show('Removed prompt from starred list.', 'info');
    }
  }
}
