import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
export interface College {
  _id: string;
  name: string;
  code: string;
  description: string;
  departments: string[];
  programs: string[];
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStats {
  totalApplications: number;
  activeColleges: number;
  totalPrograms: number;
  totalDepts: number;
}

@Injectable({ providedIn: 'root' })
export class CollegeService {
  private apiUrl = `${environment.apiUrl}/colleges`;
  private statsUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  getPublicStats(): Observable<{ success: boolean; stats: PublicStats }> {
    return this.http.get<{ success: boolean; stats: PublicStats }>(`${this.statsUrl}/public`);
  }

  getColleges(all: boolean = false): Observable<{ success: boolean; colleges: College[] }> {
    const url = all ? `${this.apiUrl}?all=true` : this.apiUrl;
    return this.http.get<{ success: boolean; colleges: College[] }>(url);
  }

  getCollege(id: string): Observable<{ success: boolean; college: College }> {
    return this.http.get<{ success: boolean; college: College }>(`${this.apiUrl}/${id}`);
  }

  createCollege(data: Partial<College>): Observable<{ success: boolean; college: College }> {
    return this.http.post<{ success: boolean; college: College }>(this.apiUrl, data);
  }

  updateCollege(id: string, data: Partial<College>): Observable<{ success: boolean; college: College }> {
    return this.http.patch<{ success: boolean; college: College }>(`${this.apiUrl}/${id}`, data);
  }

  deleteCollege(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
