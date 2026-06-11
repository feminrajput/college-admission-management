import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserInfo } from './auth.service';
import { environment } from '../../environments/environment';

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  name: string;
  role: 'super_admin' | 'college_admin';
  college: string | null;
  collegeName: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<{ success: boolean; users: AdminUser[] }> {
    return this.http.get<{ success: boolean; users: AdminUser[] }>(this.apiUrl);
  }

  getUser(id: string): Observable<{ success: boolean; user: AdminUser }> {
    return this.http.get<{ success: boolean; user: AdminUser }>(`${this.apiUrl}/${id}`);
  }

  createUser(data: any): Observable<{ success: boolean; user: AdminUser }> {
    return this.http.post<{ success: boolean; user: AdminUser }>(this.apiUrl, data);
  }

  updateUser(id: string, data: any): Observable<{ success: boolean; user: AdminUser }> {
    return this.http.patch<{ success: boolean; user: AdminUser }>(`${this.apiUrl}/${id}`, data);
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
