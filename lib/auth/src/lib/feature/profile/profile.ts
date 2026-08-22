import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'lib-auth-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1 class="page-title">User Profile</h1>
      <p class="page-subtitle">Manage your account settings, session status, and workspace roles.</p>
    </div>

    <div class="profile-container" *ngIf="user$ | async as user">
      <!-- Profile Summary Card -->
      <div class="profile-card summary-card">
        <div class="card-glow-purple"></div>
        <div class="summary-header">
          <div class="avatar-large">
            <span *ngIf="!user.avatarUrl">{{ getInitials(user) }}</span>
            <img *ngIf="user.avatarUrl" [src]="user.avatarUrl" alt="Avatar" />
          </div>
          <div class="summary-meta">
            <h2 class="display-name">{{ user.displayName || user.username }}</h2>
            <p class="username">&#64;{{ user.username }}</p>
            <span class="role-badge" [class]="user.role.toLowerCase()">
              {{ user.role }}
            </span>
          </div>
        </div>
      </div>

      <!-- Details List Card -->
      <div class="profile-card details-card">
        <h3>Account Specifications</h3>
        <div class="details-list">
          <div class="detail-item">
            <span class="detail-label">Unique Identifier</span>
            <span class="detail-value mono">{{ user.id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email Address</span>
            <span class="detail-value">{{ user.email }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Account Status</span>
            <span class="detail-value badge-active">{{ user.status || 'ACTIVE' }}</span>
          </div>
          <div class="detail-item" *ngIf="user.createdAt">
            <span class="detail-label">Registration Date</span>
            <span class="detail-value">{{ formatDate(user.createdAt) }}</span>
          </div>
          <div class="detail-item" *ngIf="user.lastLoginAt">
            <span class="detail-label">Last Session Login</span>
            <span class="detail-value">{{ formatDate(user.lastLoginAt) }}</span>
          </div>
        </div>

        <div class="action-bar">
          <button class="logout-btn" (click)="onLogout()">
            Sign Out Session
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 32px;
    }
    .page-title {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0 0 6px 0;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .page-subtitle {
      color: #94a3b8;
      font-size: 0.95rem;
      margin: 0;
    }
    .profile-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      max-width: 800px;
    }
    @media (min-width: 768px) {
      .profile-container {
        grid-template-columns: 1fr 2fr;
      }
    }
    .profile-card {
      position: relative;
      background: rgba(30, 41, 59, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }
    .card-glow-purple {
      position: absolute;
      top: -40px;
      right: -40px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: #a855f7;
      filter: blur(50px);
      opacity: 0.15;
      pointer-events: none;
    }
    .summary-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 20px;
    }
    .avatar-large {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      border-radius: 50%;
      font-size: 2.2rem;
      font-weight: 700;
      color: #ffffff;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.1);
    }
    .avatar-large img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    .display-name {
      font-size: 1.4rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 4px 0;
    }
    .username {
      color: #64748b;
      font-size: 0.95rem;
      margin: 0 0 16px 0;
    }
    .role-badge {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 4px 12px;
      border-radius: 12px;
      text-transform: uppercase;
      display: inline-block;
    }
    .role-badge.admin {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .role-badge.user {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .role-badge.publisher {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .role-badge.moderator {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .details-card h3 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 24px;
      color: #cbd5e1;
    }
    .details-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 32px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 4px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 14px;
    }
    @media (min-width: 480px) {
      .detail-item {
        flex-direction: row;
        align-items: center;
        gap: 20px;
      }
    }
    .detail-label {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }
    .detail-value {
      font-size: 0.95rem;
      color: #e2e8f0;
      font-weight: 600;
    }
    .detail-value.mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.85rem;
      color: #cbd5e1;
    }
    .detail-value.badge-active {
      font-size: 0.8rem;
      color: #34d399;
      background: rgba(16, 185, 129, 0.1);
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .action-bar {
      display: flex;
      justify-content: flex-end;
    }
    .logout-btn {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 10px;
      padding: 10px 20px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .logout-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #ffffff;
      transform: translateY(-1px);
    }
    .logout-btn:active {
      transform: translateY(0);
    }
  `]
})
export class ProfileComponent implements OnInit {
  user$!: Observable<User | null>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user$ = this.authService.currentUser$;
  }

  getInitials(user: User): string {
    const name = user.displayName || user.username || '';
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  formatDate(dateString: string): string {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return dateString;
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}
