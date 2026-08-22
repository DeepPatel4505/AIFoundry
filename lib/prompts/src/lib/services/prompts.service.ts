import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, switchMap, catchError, shareReplay } from 'rxjs/operators';

export interface PromptVariable {
  name: string;
  description: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  tags: string[];
  isPublic: boolean;
  variables: PromptVariable[];
  changeLog?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PromptsService {
  private apiUrl = 'http://localhost:3000/api/v1/prompts';

  // Filter States
  private searchSubject = new BehaviorSubject<string>('');
  private visibilitySubject = new BehaviorSubject<string>('All');
  private pageSubject = new BehaviorSubject<number>(1);
  private limitSubject = new BehaviorSubject<number>(9);
  private refreshSubject = new BehaviorSubject<void>(undefined);

  paginationMetadata$ = new BehaviorSubject<{ page: number; limit: number; total: number; totalPages: number }>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  });

  filteredPrompts$: Observable<PromptTemplate[]> = combineLatest([
    this.searchSubject,
    this.visibilitySubject,
    this.pageSubject,
    this.limitSubject,
    this.refreshSubject,
  ]).pipe(
    switchMap(([search, visibility, page, limit]) => {
      let params = new HttpParams()
        .set('page', page.toString())
        .set('limit', limit.toString());

      if (search.trim()) {
        params = params.set('search', search);
      }

      if (visibility !== 'All') {
        params = params.set('visibility', visibility.toUpperCase()); // PUBLIC or PRIVATE
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
              name: item.name,
              description: item.description || '',
              template: `(Prompt template content is versioned inside ${item.version || '1.0.0'})`,
              tags: item.tags || [],
              isPublic: item.visibility === 'PUBLIC',
              variables: [], // Variables list is fetched on details view
              model: item.recommendedModel || '',
              maxTokens: item.maxTokens || 2048,
              temperature: item.temperature || 0.7,
            }));
          }
          return [];
        }),
        catchError((err) => {
          console.error('Error fetching prompts from API:', err);
          return of([]);
        })
      );
    }),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {}

  setSearch(q: string) {
    this.searchSubject.next(q);
    this.pageSubject.next(1);
  }

  setVisibility(visibility: string) {
    this.visibilitySubject.next(visibility);
    this.pageSubject.next(1);
  }

  setPage(page: number) {
    this.pageSubject.next(page);
  }

  setLimit(limit: number) {
    this.limitSubject.next(limit);
    this.pageSubject.next(1);
  }

  refresh(): void {
    this.refreshSubject.next(undefined);
  }

  addPrompt(newPrompt: Omit<PromptTemplate, 'id'>): Observable<any> {
    const payload = {
      name: newPrompt.name,
      description: newPrompt.description,
      visibility: newPrompt.isPublic ? 'PUBLIC' : 'PRIVATE',
      tags: newPrompt.tags,
      content: newPrompt.template,
      variables: newPrompt.variables.map((v) => ({
        name: v.name,
        description: v.description,
        type: 'STRING',
        required: true,
      })),
      recommendedModel: newPrompt.model
        ? newPrompt.model.toLowerCase().replace(/\s+/g, '-')
        : 'gemini-2.0-flash',
      maxTokens: newPrompt.maxTokens,
      temperature: newPrompt.temperature,
      changelog: newPrompt.changeLog || 'Initial version',
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      map((res) => {
        // Trigger list reload after addition
        this.refresh();
        return res;
      })
    );
  }

  getPrompt(idOrSlug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${idOrSlug}`);
  }
}
