import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'super_admin' | 'college_admin';
  college: string | null;
  collegeName: string | null;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: UserInfo;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'gu_token';
  private userKey = 'gu_user';

  private currentUser$ = new BehaviorSubject<UserInfo | null>(this.getStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap((res) => {
        if (res.success) {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, JSON.stringify(res.user));
          this.currentUser$.next(res.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('adminAuth');
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): UserInfo | null {
    return this.currentUser$.value;
  }

  getUserObservable(): Observable<UserInfo | null> {
    return this.currentUser$.asObservable();
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  isCollegeAdmin(): boolean {
    return this.hasRole('college_admin');
  }

  getDashboardRoute(): string {
    if (this.isSuperAdmin()) return '/super-admin/dashboard';
    if (this.isCollegeAdmin()) return '/admin/dashboard';
    return '/';
  }

  private getStoredUser(): UserInfo | null {
    try {
      const stored = localStorage.getItem(this.userKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
