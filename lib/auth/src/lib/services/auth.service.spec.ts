import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, User } from './auth.service';

describe('AuthService (Session Persistence on Refresh)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: { navigate: jest.Mock };

  // Create a valid JWT token payload that expires in 1 hour
  const validExp = Math.floor(Date.now() / 1000) + 3600;
  const validPayload = btoa(JSON.stringify({
    id: 'user-123',
    email: 'test@janus.dev',
    username: 'janus_dev',
    displayName: 'Janus Developer',
    role: 'USER',
    exp: validExp,
  }));
  const mockValidToken = `header.${validPayload}.signature`;

  // Create an expired JWT token payload (expired 1 hour ago)
  const expiredExp = Math.floor(Date.now() / 1000) - 3600;
  const expiredPayload = btoa(JSON.stringify({
    id: 'user-123',
    email: 'test@janus.dev',
    username: 'janus_dev',
    displayName: 'Janus Developer',
    role: 'USER',
    exp: expiredExp,
  }));
  const mockExpiredToken = `header.${expiredPayload}.signature`;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@janus.dev',
    username: 'janus_dev',
    displayName: 'Janus Developer',
    avatarUrl: null,
    role: 'USER',
  };

  beforeEach(() => {
    localStorage.clear();
    routerSpy = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should initialize session immediately and restore user when valid access token exists', (done) => {
    localStorage.setItem('janus_access_token', mockValidToken);
    localStorage.setItem('janus_refresh_token', 'mock_refresh_token');
    localStorage.setItem('janus_user', JSON.stringify(mockUser));

    service = TestBed.inject(AuthService);

    expect(service.isLoggedIn()).toBe(true);

    service.currentUser$.subscribe((user) => {
      if (user) {
        expect(user.username).toBe('janus_dev');
      }
    });

    service.sessionInitialized$.subscribe((initialized) => {
      if (initialized) {
        expect(initialized).toBe(true);
        expect(service.isLoggedIn()).toBe(true);
        done();
      }
    });

    // Handle background /me request
    const req = httpMock.expectOne('http://localhost:3000/api/v1/auth/me');
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: mockUser });
  });

  it('should not clear session or log out if background /me encounters a transient error', (done) => {
    localStorage.setItem('janus_access_token', mockValidToken);
    localStorage.setItem('janus_refresh_token', 'mock_refresh_token');
    localStorage.setItem('janus_user', JSON.stringify(mockUser));

    service = TestBed.inject(AuthService);

    // Initial check: session initialized immediately
    expect(service.isLoggedIn()).toBe(true);

    // Background /me fails with 500 error
    const req = httpMock.expectOne('http://localhost:3000/api/v1/auth/me');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    // Verify token and user were NOT wiped out by the transient error
    expect(service.getAccessToken()).toBe(mockValidToken);
    expect(service.getRefreshToken()).toBe('mock_refresh_token');
    expect(service.isLoggedIn()).toBe(true);
    done();
  });

  it('should refresh access token when token is expired but refresh token exists', (done) => {
    localStorage.setItem('janus_access_token', mockExpiredToken);
    localStorage.setItem('janus_refresh_token', 'valid_refresh_token');

    service = TestBed.inject(AuthService);

    // Should call /refresh
    const refreshReq = httpMock.expectOne('http://localhost:3000/api/v1/auth/refresh');
    expect(refreshReq.request.method).toBe('POST');
    refreshReq.flush({
      success: true,
      data: {
        accessToken: mockValidToken,
        refreshToken: 'new_refresh_token',
      },
    });

    // Then calls /me
    const meReq = httpMock.expectOne('http://localhost:3000/api/v1/auth/me');
    meReq.flush({ success: true, data: mockUser });

    service.sessionInitialized$.subscribe((initialized) => {
      if (initialized) {
        expect(service.getAccessToken()).toBe(mockValidToken);
        expect(service.getRefreshToken()).toBe('new_refresh_token');
        expect(service.isLoggedIn()).toBe(true);
        done();
      }
    });
  });

  it('should clear session if no tokens exist', (done) => {
    service = TestBed.inject(AuthService);

    service.sessionInitialized$.subscribe((initialized) => {
      if (initialized) {
        expect(service.isLoggedIn()).toBe(false);
        expect(service.getAccessToken()).toBeNull();
        done();
      }
    });
  });
});
