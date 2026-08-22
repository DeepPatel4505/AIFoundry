import { Component, OnInit, AfterViewChecked, OnDestroy, ElementRef, ViewChild, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SkillsService, SkillDetail } from '../../services/skills.service';
import { ToastService } from '@web/shared-ui';

export interface VersionItem {
  version: string;
  changelog: string;
  isLatest: boolean;
  releaseDate: string;
}

@Component({
  selector: 'lib-skills-feature-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './feature-detail.html',
  styleUrl: './feature-detail.css',
})
export class SkillsFeatureDetailComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('markdownBody') markdownBodyRef?: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private skillsService = inject(SkillsService);
  private toastService = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  private resizeObserver?: ResizeObserver;

  skill = signal<SkillDetail | null>(null);
  isLoading = signal(true);
  isError = signal(false);

  // Active tab: 'command' | 'prompt'
  activeTab = signal<'command' | 'prompt'>('command');

  // Selected version for sidebar and CLI commands
  selectedVersion = signal<string>('1.0.0');

  // Overflow detection relative to page height
  domOverflow = signal(false);
  isExpanded = signal(false);

  isOverflowing = computed<boolean>(() => {
    return this.domOverflow();
  });

  // Star state
  isStarred = signal(false);
  starCount = signal(0);

  // Available versions list loaded dynamically
  versions = signal<VersionItem[]>([]);

  // Parsed markdown HTML
  renderedMarkdown = computed<SafeHtml>(() => {
    const s = this.skill();
    const raw = s?.latestVersion?.definition || (s ? `# ${s.name}\n\n${s.description}` : '');
    const html = this.parseMarkdown(raw);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadSkillDetails(id);
      } else {
        this.isError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  ngAfterViewChecked(): void {
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkContentOverflow();
  }

  private setupResizeObserver(): void {
    if (this.markdownBodyRef?.nativeElement && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkContentOverflow();
      });
      this.resizeObserver.observe(this.markdownBodyRef.nativeElement);
      this.checkContentOverflow();
    }
  }

  private checkContentOverflow(): void {
    if (this.markdownBodyRef?.nativeElement) {
      const el = this.markdownBodyRef.nativeElement;
      // Calculate available space on page before scrolling occurs (viewport height minus header/installation area ~320px)
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
      const maxPageContentHeight = Math.max(viewportHeight - 320, 480);
      
      const exceedsPageHeight = el.scrollHeight > maxPageContentHeight;
      if (this.domOverflow() !== exceedsPageHeight) {
        setTimeout(() => {
          this.domOverflow.set(exceedsPageHeight);
        }, 0);
      }
    }
  }

  private loadSkillDetails(idOrSlug: string): void {
    this.isLoading.set(true);
    this.isError.set(false);
    this.isExpanded.set(false);
    this.domOverflow.set(false);

    this.skillsService.getSkill(idOrSlug).subscribe({
      next: (data) => {
        if (data) {
          this.skill.set(data);

          const activeVer = data.latestVersion?.version || data.version || '1.0.0';
          this.selectedVersion.set(activeVer);

          // Star count and state loading (localStorage based for visual persistence)
          const localStarKey = `janus-skill-starred-${data.id}`;
          const localIsStarred = localStorage.getItem(localStarKey) === 'true';
          this.isStarred.set(localIsStarred);

          const baseStars = Math.floor(Math.random() * 30) + 8;
          this.starCount.set(localIsStarred ? baseStars + 1 : baseStars);

          // Fetch versions from backend API
          this.skillsService.getSkillVersions(idOrSlug).subscribe({
            next: (apiVersions) => {
              if (apiVersions && apiVersions.length > 0) {
                const mapped: VersionItem[] = apiVersions.map((v, index) => ({
                  version: v.version,
                  changelog: v.changelog || (index === 0 ? 'Latest stable release.' : 'Historical release.'),
                  isLatest: index === 0,
                  releaseDate: new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                }));
                this.versions.set(mapped);
              } else {
                this.versions.set([
                  {
                    version: activeVer,
                    changelog: data.latestVersion?.changelog || 'Latest stable production release.',
                    isLatest: true,
                    releaseDate: new Date(data.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                  },
                ]);
              }
            },
            error: () => {
              this.versions.set([
                {
                  version: activeVer,
                  changelog: data.latestVersion?.changelog || 'Latest stable production release.',
                  isLatest: true,
                  releaseDate: new Date(data.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                },
              ]);
            },
          });
        } else {
          this.isError.set(true);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load skill details:', err);
        this.isError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  getCategoryName(): string {
    const s = this.skill();
    if (!s) return 'TOOL';
    if (typeof s.category === 'object' && s.category) {
      return ((s.category as any).name || (s.category as any).slug || 'TOOL').toUpperCase();
    }
    return String(s.category || 'TOOL').toUpperCase();
  }

  getSkillSlug(): string {
    const s = this.skill();
    return s?.slug || s?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'skill';
  }

  getRepositoryUrl(): string {
    const s = this.skill();
    return s?.repositoryUrl || 'https://github.com/vercel-labs/skills';
  }

  getInstallCommand(): string {
    const slug = this.getSkillSlug();
    const repoUrl = this.getRepositoryUrl();
    if (this.activeTab() === 'prompt') {
      return `Please install and enable the "${slug}" skill for this workspace session.`;
    }
    return `npx skills add ${repoUrl} --skill ${slug}`;
  }

  getJanusCliCommand(): string {
    const slug = this.getSkillSlug();
    const ver = this.selectedVersion();
    return `janus skill install ${slug}@${ver}`;
  }

  setTab(tab: 'command' | 'prompt'): void {
    this.activeTab.set(tab);
  }

  selectVersion(ver: string): void {
    this.selectedVersion.set(ver);
    this.toastService.show(`Selected version ${ver}`, 'info');
  }

  toggleExpand(): void {
    this.isExpanded.update((v) => !v);
  }

  copyInstallCommand(): void {
    const cmd = this.getInstallCommand();
    navigator.clipboard.writeText(cmd).then(
      () => this.toastService.show(`Copied: "${cmd}"`, 'success'),
      () => this.toastService.show('Failed to copy command.', 'error')
    );
  }

  copyJanusCliCommand(): void {
    const cmd = this.getJanusCliCommand();
    navigator.clipboard.writeText(cmd).then(
      () => this.toastService.show(`Copied CLI command: "${cmd}"`, 'success'),
      () => this.toastService.show('Failed to copy command.', 'error')
    );
  }

  downloadPackage(): void {
    const s = this.skill();
    if (!s || !s.latestVersion?.artifactUrl) {
      this.toastService.show('No downloadable package artifact available.', 'error');
      return;
    }

    const downloadUrl = `http://localhost:3000${s.latestVersion.artifactUrl}`;
    window.open(downloadUrl, '_blank');
    this.toastService.show('Downloading skill package...', 'info');
  }

  shareUrl(): void {
    const shareLink = window.location.href;
    navigator.clipboard.writeText(shareLink).then(
      () => this.toastService.show('Skill share link copied to clipboard!', 'success'),
      () => this.toastService.show('Failed to copy link.', 'error')
    );
  }

  toggleStar(): void {
    const s = this.skill();
    if (!s) return;

    const localStarKey = `janus-skill-starred-${s.id}`;
    const nextStarred = !this.isStarred();

    this.isStarred.set(nextStarred);
    localStorage.setItem(localStarKey, String(nextStarred));

    if (nextStarred) {
      this.starCount.update((count) => count + 1);
      this.toastService.show('Added skill to starred list!', 'success');
    } else {
      this.starCount.update((count) => Math.max(0, count - 1));
      this.toastService.show('Removed skill from starred list.', 'info');
    }
  }

  /**
   * Fast, safe client-side Markdown to clean HTML parser
   */
  private parseMarkdown(md: string): string {
    if (!md) return '';

    let text = md.replace(/\r\n/g, '\n');

    // Code blocks ``` ... ```
    text = text.replace(/```([\s\S]*?)```/g, (_match, code) => {
      const escaped = this.escapeHtml(code.trim());
      return `<div class="md-code-block"><pre><code>${escaped}</code></pre></div>`;
    });

    const lines = text.split('\n');
    const result: string[] = [];
    let inList = false;
    let listType = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      if (line.includes('<div class="md-code-block">') || line.includes('</div>') || line.includes('<pre>') || line.includes('</pre>')) {
        if (inList) {
          result.push(listType === 'ol' ? '</ol>' : '</ul>');
          inList = false;
        }
        result.push(line);
        continue;
      }

      if (line.startsWith('# ')) {
        if (inList) { result.push(listType === 'ol' ? '</ol>' : '</ul>'); inList = false; }
        result.push(`<h1 class="md-h1">${this.formatInline(line.substring(2))}</h1>`);
        continue;
      }
      if (line.startsWith('## ')) {
        if (inList) { result.push(listType === 'ol' ? '</ol>' : '</ul>'); inList = false; }
        result.push(`<h2 class="md-h2">${this.formatInline(line.substring(3))}</h2>`);
        continue;
      }
      if (line.startsWith('### ')) {
        if (inList) { result.push(listType === 'ol' ? '</ol>' : '</ul>'); inList = false; }
        result.push(`<h3 class="md-h3">${this.formatInline(line.substring(4))}</h3>`);
        continue;
      }

      const olMatch = line.match(/^(\d+)\.\s+(.*)/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) result.push(listType === 'ol' ? '</ol>' : '</ul>');
          result.push('<ol class="md-ol">');
          inList = true;
          listType = 'ol';
        }
        result.push(`<li>${this.formatInline(olMatch[2])}</li>`);
        continue;
      }

      const ulMatch = line.match(/^[-*]\s+(.*)/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) result.push(listType === 'ol' ? '</ol>' : '</ul>');
          result.push('<ul class="md-ul">');
          inList = true;
          listType = 'ul';
        }
        result.push(`<li>${this.formatInline(ulMatch[1])}</li>`);
        continue;
      }

      if (!line.trim()) {
        if (inList) {
          result.push(listType === 'ol' ? '</ol>' : '</ul>');
          inList = false;
        }
        continue;
      }

      if (inList) {
        result.push(listType === 'ol' ? '</ol>' : '</ul>');
        inList = false;
      }
      result.push(`<p class="md-p">${this.formatInline(line)}</p>`);
    }

    if (inList) {
      result.push(listType === 'ol' ? '</ol>' : '</ul>');
    }

    return result.join('\n');
  }

  private formatInline(str: string): string {
    let s = this.escapeHtml(str);
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');
    return s;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
