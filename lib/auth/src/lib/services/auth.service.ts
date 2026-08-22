import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  status?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

export interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authUrl = 'http://localhost:3000/api/v1/auth';
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private sessionInitializedSubject = new BehaviorSubject<boolean>(false);
  public sessionInitialized$ = this.sessionInitializedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeSession();
  }

  private initializeSession(): void {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!token && !refreshToken) {
      this.clearSession();
      this.sessionInitializedSubject.next(true);
      return;
    }

    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded && !this.isTokenExpired(decoded)) {
        // Set temp user from decoded token so UI feels fast/responsive
        this.currentUserSubject.next({
          id: decoded.id,
          email: decoded.email,
          username: decoded.username,
          displayName: decoded.displayName,
          avatarUrl: decoded.avatarUrl || null,
          role: decoded.role,
        });

        // Load full profile
        this.fetchCurrentUser().subscribe({
          next: () => {
            this.sessionInitializedSubject.next(true);
          },
          error: () => {
            // Try refreshing if fetch fails
            this.tryRefreshAndFetch();
          }
        });
      } else {
        // Token is expired, try to refresh
        this.tryRefreshAndFetch();
      }
    } else {
      // No access token, but refresh token is present
      this.tryRefreshAndFetch();
    }
  }

  private tryRefreshAndFetch(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.refreshAccessToken().pipe(
        switchMap(() => this.fetchCurrentUser())
      ).subscribe({
        next: () => {
          this.sessionInitializedSubject.next(true);
        },
        error: () => {
          this.clearSession();
          this.sessionInitializedSubject.next(true);
        }
      });
    } else {
      this.clearSession();
      this.sessionInitializedSubject.next(true);
    }
  }

  public getAccessToken(): string | null {
    return localStorage.getItem('janus_access_token');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('janus_refresh_token');
  }

  private setSession(accessToken: string, refreshToken: string, user: User): void {
    localStorage.setItem('janus_access_token', accessToken);
    localStorage.setItem('janus_refresh_token', refreshToken);
    this.currentUserSubject.next(user);
  }

  public clearSession(): void {
    localStorage.removeItem('janus_access_token');
    localStorage.removeItem('janus_refresh_token');
    this.currentUserSubject.next(null);
  }

  public register(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/register`, payload).pipe(
      tap((res) => {
        if (res && res.success && res.data) {
          this.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
        }
      })
    );
  }

  public login(payload: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authUrl}/login`, payload).pipe(
      tap((res) => {
        if (res && res.success && res.data) {
          this.setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
        }
      })
    );
  }

  public logout(): Observable<any> {
    const token = this.getAccessToken();
    const logoutAction = () => {
      this.clearSession();
      this.router.navigate(['/login']);
    };

    if (!token) {
      logoutAction();
      return of({ success: true });
    }

    return this.http.post(`${this.authUrl}/logout`, {}).pipe(
      tap(logoutAction),
      catchError((err) => {
        logoutAction();
        return of({ success: true });
      })
    );
  }

  public fetchCurrentUser(): Observable<User> {
    return this.http.get<any>(`${this.authUrl}/me`).pipe(
      map((res) => {
        if (res && res.success && res.data) {
          this.currentUserSubject.next(res.data);
          return res.data;
        }
        throw new Error('Failed to load user profile');
      }),
      tap({
        error: () => this.clearSession()
      })
    );
  }

  public refreshAccessToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<RefreshResponse>(`${this.authUrl}/refresh`, { refreshToken }).pipe(
      map((res) => {
        if (res && res.success && res.data) {
          localStorage.setItem('janus_access_token', res.data.accessToken);
          localStorage.setItem('janus_refresh_token', res.data.refreshToken);
          return res.data.accessToken;
        }
        throw new Error('Failed to refresh tokens');
      }),
      catchError((err) => {
        this.clearSession();
        this.router.navigate(['/login']);
        return throwError(() => err);
      })
    );
  }

  public isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    const decoded = this.decodeToken(token);
    return decoded ? !this.isTokenExpired(decoded) : false;
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }

  private isTokenExpired(decodedToken: any): boolean {
    if (!decodedToken || !decodedToken.exp) return true;
    const expirationDate = new Date(0);
    expirationDate.setUTCSeconds(decodedToken.exp);
    // Buffer of 10 seconds to handle request latency
    return expirationDate.valueOf() < (new Date().valueOf() + 10000);
  }
}
