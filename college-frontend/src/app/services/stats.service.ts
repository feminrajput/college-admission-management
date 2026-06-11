import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
export interface DashboardStats {
  total: number;
  underReview: number;
  approved: number;
  rejected: number;
  queryRaised: number;
  todayCount: number;
}

export interface CollegeStat {
  collegeName: string;
  collegeCode: string;
  total: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface OverviewData {
  totalApplications: number;
  activeColleges: number;
  activeUsers: number;
  collegeStats: CollegeStat[];
  monthlyTrend: MonthlyTrend[];
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private apiUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) { }

  getStats(): Observable<{ success: boolean; stats: DashboardStats; recentApplications: any[]; message?: string }> {
    return this.http.get<{ success: boolean; stats: DashboardStats; recentApplications: any[]; message?: string }>(this.apiUrl);
  }

  getOverview(): Observable<{ success: boolean; overview: OverviewData }> {
    return this.http.get<{ success: boolean; overview: OverviewData }>(`${this.apiUrl}/overview`);
  }
}
