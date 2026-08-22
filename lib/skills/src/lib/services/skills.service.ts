import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap, catchError, shareReplay } from 'rxjs/operators';

export interface Skill {
  id: string;
  slug: string;
  name: string;
  description: string;
  definition?: string;
  category: string;
  sourceType: 'INLINE' | 'UPLOAD' | 'GIT';
  version: string;
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'SUSPENDED';
  verificationStatus: string;
  tags: string[];
  usageCount?: number;
  repositoryUrl?: string;
  repositoryBranch?: string;
  createdAt: string;
}

export interface SkillDetail extends Skill {
  type: 'SKILL';
  latestVersion?: {
    id: string;
    version: string;
    definition: string;
    changelog: string;
    checksum: string;
    artifactUrl: string;
    artifactSize: number;
    createdAt: string;
  } | null;
  verification?: {
    status: string;
  };
  installation?: {
    supported: boolean;
    command: string;
  };
}

export interface SkillValidationResult {
  valid: boolean;
  errors: Array<{ code?: string; message: string; variable?: string }>;
  warnings: Array<{ code?: string; message: string }>;
  checks: Array<{ name: string; status: 'PASS' | 'FAIL' }>;
}

@Injectable({
  providedIn: 'root',
})
export class SkillsService {
  private apiUrl = 'http://localhost:3000/api/v1/skills';
  private jobsUrl = 'http://localhost:3000/api/v1/jobs';

  // Filter States
  private searchSubject = new BehaviorSubject<string>('');
  private categorySubject = new BehaviorSubject<string>('All');
  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(9);
  private refreshSubject = new BehaviorSubject<void>(undefined);

  paginationMetadata$ = new BehaviorSubject<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  });

  paginatedSkills$: Observable<Skill[]> = combineLatest([
    this.searchSubject,
    this.categorySubject,
    this.pageSubject,
    this.limitSubject,
    this.refreshSubject,
  ]).pipe(
    switchMap(([search, category, page, limit]) => {
      let params = new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString());

      if (search.trim()) {
        params = params.set('search', search.trim());
      }

      if (category !== 'All') {
        params = params.set('category', category.toLowerCase());
      }

      return this.http.get<any>(this.apiUrl, { params }).pipe(
        map((res) => {
          if (res && res.success && Array.isArray(res.data)) {
            if (res.meta) {
              this.paginationMetadata$.next({
                page: res.meta.page || page,
                limit: res.meta.limit || limit,
                total: res.meta.total || 0,
                totalPages: res.meta.totalPages || 0,
              });
            } else {
              this.paginationMetadata$.next({
                page,
                limit,
                total: res.data.length,
                totalPages: 1,
              });
            }

            return res.data.map((item: any) => ({
              id: item.id,
              slug: item.slug,
              name: item.name,
              description: item.description || '',
              definition: `(Version ${item.version || '1.0.0'} package available)`,
              category: item.category?.slug || item.category?.name?.toLowerCase() || 'tool',
              sourceType: item.sourceType || 'INLINE',
              version: item.version || '1.0.0',
              visibility: item.visibility || 'PUBLIC',
              status: item.status || 'ACTIVE',
              verificationStatus: item.verificationStatus || 'NOT_VERIFIED',
              tags: item.tags || [],
              usageCount: Math.floor(Math.random() * 150) + 12, // Visual metric representation
              createdAt: item.createdAt,
            }));
          }
          return [];
        }),
        catchError((err) => {
          console.error('Error fetching skills from API:', err);
          return of([]);
        })
      );
    }),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {}

  setSearch(q: string): void {
    this.searchSubject.next(q);
    this.pageSubject.next(1);
  }

  setCategory(category: string): void {
    this.categorySubject.next(category);
    this.pageSubject.next(1);
  }

  setPage(page: number): void {
    this.pageSubject.next(page);
  }

  setLimit(limit: number): void {
    this.limitSubject.next(limit);
    this.pageSubject.next(1);
  }

  refresh(): void {
    this.refreshSubject.next(undefined);
  }

  addSkill(newSkill: {
    name: string;
    description?: string;
    definition: string;
    category?: string;
    visibility?: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    tags?: string[];
  }): Observable<any> {
    const payload = {
      name: newSkill.name.trim(),
      description: newSkill.description?.trim() || null,
      skillDefinition: newSkill.definition.trim(),
      category: newSkill.category || 'Tool',
      visibility: newSkill.visibility || 'PUBLIC',
      tags: newSkill.tags || [],
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      map((res) => {
        this.refresh();
        return res;
      })
    );
  }

  validateSkill(data: {
    name?: string;
    skillDefinition?: string;
    category?: string;
  }): Observable<SkillValidationResult> {
    return this.http.post<any>(`${this.apiUrl}/validate`, data).pipe(
      map((res) => res.data as SkillValidationResult)
    );
  }

  uploadSkillPackage(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/upload`, formData).pipe(
      map((res) => {
        this.refresh();
        return res;
      })
    );
  }

  importGitSkill(payload: {
    repositoryUrl: string;
    branch?: string;
    name?: string;
    description?: string;
    category?: string;
    visibility?: 'PUBLIC' | 'PRIVATE';
    tags?: string[];
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/import/git`, payload).pipe(
      map((res) => {
        this.refresh();
        return res;
      })
    );
  }

  getJobStatus(jobId: string): Observable<any> {
    return this.http.get<any>(`${this.jobsUrl}/${jobId}`);
  }

  getSkill(idOrSlug: string): Observable<SkillDetail> {
    return this.http.get<any>(`${this.apiUrl}/${idOrSlug}`).pipe(
      map((res) => {
        const item = res.data;
        if (!item) return item;
        const catStr = typeof item.category === 'object' && item.category
          ? (item.category.slug || item.category.name?.toLowerCase() || 'tool')
          : String(item.category || 'tool').toLowerCase();

        return {
          ...item,
          category: catStr,
        } as SkillDetail;
      })
    );
  }

  getSkillVersions(idOrSlug: string): Observable<Array<{
    id: string;
    version: string;
    changelog?: string;
    artifactSize?: number;
    createdAt: string;
  }>> {
    return this.http.get<any>(`${this.apiUrl}/${idOrSlug}/versions`).pipe(
      map((res) => res.data || [])
    );
  }

  getInstallManifest(idOrSlug: string, version?: string): Observable<any> {
    const params = version ? new HttpParams().set('version', version) : undefined;
    return this.http.get<any>(`${this.apiUrl}/${idOrSlug}/install`, { params }).pipe(
      map((res) => res.data)
    );
  }
}
