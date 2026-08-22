import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'lib-auth-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="background-decor">
        <div class="blob blob-indigo"></div>
        <div class="blob blob-purple"></div>
      </div>

      <div class="login-card" *ngIf="sessionInitialized; else checkingSession">
        <div class="logo-area">
          <span class="logo-icon">J</span>
          <h1 class="logo-title">Janus</h1>
        </div>

        <div class="tabs-header">
          <button type="button" class="tab-btn" [class.active]="isLoginMode" (click)="setMode(true)">
            Sign In
          </button>
          <button type="button" class="tab-btn" [class.active]="!isLoginMode" (click)="setMode(false)">
            Register
          </button>
          <div class="tab-indicator" [style.transform]="isLoginMode ? 'translateX(0)' : 'translateX(100%)'"></div>
        </div>

        <form #authForm="ngForm" (ngSubmit)="onSubmit(authForm)" class="auth-form">
          <div class="alert alert-danger" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>

          <!-- Display Name (Register only) -->
          <div class="form-group" *ngIf="!isLoginMode">
            <label for="displayName" class="form-label">Display Name</label>
            <div class="input-container">
              <input
                type="text"
                id="displayName"
                name="displayName"
                [(ngModel)]="formData.displayName"
                class="form-input"
                placeholder="Elena Rostova"
              />
            </div>
          </div>

          <!-- Username (Register only) -->
          <div class="form-group" *ngIf="!isLoginMode">
            <label for="username" class="form-label">Username *</label>
            <div class="input-container">
              <input
                type="text"
                id="username"
                name="username"
                [(ngModel)]="formData.username"
                required
                minlength="3"
                #usernameInput="ngModel"
                class="form-input"
                placeholder="elena_r"
                [class.invalid]="usernameInput.invalid && (usernameInput.dirty || authForm.submitted)"
              />
            </div>
            <div class="input-error" *ngIf="usernameInput.invalid && (usernameInput.dirty || authForm.submitted)">
              Username must be at least 3 characters.
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email" class="form-label">Email Address *</label>
            <div class="input-container">
              <input
                type="email"
                id="email"
                name="email"
                [(ngModel)]="formData.email"
                required
                email
                #emailInput="ngModel"
                class="form-input"
                placeholder="name@example.com"
                [class.invalid]="emailInput.invalid && (emailInput.dirty || authForm.submitted)"
              />
            </div>
            <div class="input-error" *ngIf="emailInput.invalid && (emailInput.dirty || authForm.submitted)">
              Please enter a valid email address.
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password" class="form-label">Password *</label>
            <div class="input-container">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                name="password"
                [(ngModel)]="formData.password"
                required
                [minlength]="isLoginMode ? 1 : 6"
                #passwordInput="ngModel"
                class="form-input password-input"
                placeholder="••••••••"
                [class.invalid]="passwordInput.invalid && (passwordInput.dirty || authForm.submitted)"
              />
              <button type="button" class="toggle-password" (click)="showPassword = !showPassword" tabindex="-1">
                <span class="eye-icon">{{ showPassword ? '🔑' : '👁️' }}</span>
              </button>
            </div>
            <div class="input-error" *ngIf="passwordInput.invalid && (passwordInput.dirty || authForm.submitted)">
              <span *ngIf="isLoginMode">Password is required.</span>
              <span *ngIf="!isLoginMode">Password must be at least 6 characters.</span>
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="submit-btn" [disabled]="loading">
            <span *ngIf="!loading">{{ isLoginMode ? 'Sign In' : 'Create Account' }}</span>
            <div class="spinner" *ngIf="loading"></div>
          </button>
        </form>
      </div>

      <ng-template #checkingSession>
        <div class="login-card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; gap: 16px;">
          <div class="spinner"></div>
          <p style="color: #94a3b8; font-weight: 500; font-size: 0.95rem; margin: 0;">Verifying session...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .login-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f172a; /* Sleek slate background */
      font-family: 'Inter', system-ui, sans-serif;
      overflow: hidden;
      z-index: 9999;
    }
    .background-decor {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      pointer-events: none;
      z-index: 1;
    }
    .blob {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }
    .blob-indigo {
      background: #6366f1;
      top: -100px;
      left: -100px;
      animation: float-slow 20s infinite alternate;
    }
    .blob-purple {
      background: #a855f7;
      bottom: -150px;
      right: -100px;
      animation: float-slow-reverse 25s infinite alternate;
    }
    @keyframes float-slow {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(60px, 40px) scale(1.1); }
    }
    @keyframes float-slow-reverse {
      0% { transform: translate(0, 0) scale(1.1); }
      100% { transform: translate(-50px, -60px) scale(0.9); }
    }
    .login-card {
      position: relative;
      width: 100%;
      max-width: 440px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 2;
    }
    .logo-area {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 32px;
    }
    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: #ffffff;
      font-size: 1.4rem;
      font-weight: 800;
      border-radius: 12px;
      box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
    }
    .logo-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .tabs-header {
      position: relative;
      display: flex;
      background: rgba(15, 23, 42, 0.5);
      border-radius: 12px;
      margin-bottom: 32px;
      padding: 4px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .tab-btn {
      flex: 1;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 0.95rem;
      font-weight: 600;
      padding: 10px 0;
      cursor: pointer;
      z-index: 2;
      transition: color 0.3s ease;
    }
    .tab-btn.active {
      color: #ffffff;
    }
    .tab-indicator {
      position: absolute;
      top: 4px;
      left: 4px;
      width: calc(50% - 4px);
      height: calc(100% - 8px);
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      z-index: 1;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .form-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
      letter-spacing: 0.2px;
    }
    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    .form-input {
      width: 100%;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 12px 16px;
      color: #f8fafc;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }
    .form-input::placeholder {
      color: #475569;
    }
    .form-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
      background: rgba(15, 23, 42, 0.8);
    }
    .form-input.invalid {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
    }
    .password-input {
      padding-right: 48px;
    }
    .toggle-password {
      position: absolute;
      right: 12px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      font-size: 1.1rem;
      transition: color 0.2s ease;
    }
    .toggle-password:hover {
      color: #f8fafc;
    }
    .input-error {
      color: #f87171;
      font-size: 0.75rem;
      margin-top: -2px;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      line-height: 1.4;
    }
    .alert-danger {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .submit-btn {
      position: relative;
      margin-top: 12px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: #ffffff;
      font-size: 1rem;
      font-weight: 600;
      padding: 14px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.25);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .submit-btn:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
      filter: brightness(1.1);
    }
    .submit-btn:active:not([disabled]) {
      transform: translateY(0);
    }
    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent implements OnInit {
  isLoginMode = true;
  loading = false;
  showPassword = false;
  errorMessage = '';
  sessionInitialized = false;

  formData = {
    email: '',
    username: '',
    displayName: '',
    password: '',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authService.sessionInitialized$.pipe(
      filter(initialized => initialized),
      take(1)
    ).subscribe(() => {
      this.sessionInitialized = true;
      if (this.authService.isLoggedIn()) {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
        this.router.navigateByUrl(returnUrl);
      }
    });
  }

  setMode(login: boolean): void {
    if (this.loading) return;
    this.isLoginMode = login;
    this.errorMessage = '';
  }

  onSubmit(form: any): void {
    if (form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const action$ = this.isLoginMode
      ? this.authService.login({ email: this.formData.email, password: this.formData.password })
      : this.authService.register(this.formData);

    action$.subscribe({
      next: (res) => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Authentication failed. Please check your credentials.';
      },
    });
  }
}
