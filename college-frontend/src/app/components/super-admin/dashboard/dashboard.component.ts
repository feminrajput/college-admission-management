import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { interval, Subscription, startWith, switchMap, forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { StatsService, DashboardStats, OverviewData, CollegeStat, MonthlyTrend } from '../../../services/stats.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [RouterLink, BaseChartDirective, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class SuperAdminDashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = { total: 0, underReview: 0, approved: 0, rejected: 0, queryRaised: 0, todayCount: 0 };
  overview: OverviewData | null = null;
  recentApplications: any[] = [];
  loading = true;
  private pollingSubscription?: Subscription;

  doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Under Review', 'Approved', 'Rejected', 'Query Raised'],
    datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#0ea5e9', '#10b981', '#ef4444', '#f59e0b'], borderWidth: 0, hoverOffset: 4 }],
  };
  doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 12 } } } },
  };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { label: 'Under Review', data: [], backgroundColor: '#0ea5e9' },
      { label: 'Approved', data: [], backgroundColor: '#10b981' },
      { label: 'Rejected', data: [], backgroundColor: '#ef4444' },
    ],
  };
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { Math: Math.floor, stepSize: 1 } as any } },
    plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 12 } } } },
  };

  trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{ label: 'Applications', data: [], borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#6366f1' }],
  };
  trendChartOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    plugins: { legend: { display: false } },
  };

  constructor(private statsService: StatsService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.pollingSubscription = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => forkJoin({
          stats: this.statsService.getStats(),
          overview: this.statsService.getOverview()
        }))
      )
      .subscribe({
        next: (res: any) => {
          if (res.stats.success) {
            this.stats = res.stats.stats;
            this.recentApplications = res.stats.recentApplications;
            this.updateDoughnutChart();
          }
          if (res.overview.success) {
            this.overview = res.overview.overview;
            this.updateOverviewCharts();
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error polling super admin stats:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
  }

  private updateDoughnutChart() {
    this.doughnutChartData = {
      ...this.doughnutChartData,
      datasets: [{ ...this.doughnutChartData.datasets[0], data: [this.stats.underReview, this.stats.approved, this.stats.rejected, this.stats.queryRaised] }],
    };
  }

  private updateOverviewCharts() {
    if (!this.overview) return;
    
    // Bar chart
    this.barChartData = {
      labels: this.overview.collegeStats.map((c: CollegeStat) => c.collegeCode),
      datasets: [
        { label: 'Under Review', data: this.overview.collegeStats.map((c: CollegeStat) => c.underReview), backgroundColor: '#0ea5e9' },
        { label: 'Approved', data: this.overview.collegeStats.map((c: CollegeStat) => c.approved), backgroundColor: '#10b981' },
        { label: 'Rejected', data: this.overview.collegeStats.map((c: CollegeStat) => c.rejected), backgroundColor: '#ef4444' },
      ],
    };
    
    // Trend chart
    this.trendChartData = {
      labels: this.overview.monthlyTrend.map((t: MonthlyTrend) => t.month),
      datasets: [{ ...this.trendChartData.datasets[0], data: this.overview.monthlyTrend.map((t: MonthlyTrend) => t.count) }],
    };
  }

  loadData() {
    // Legacy method - functionality moved to polling loop
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'badge-success';
      case 'Rejected': return 'badge-danger';
      case 'Query Raised': return 'badge-warning';
      default: return 'badge-info';
    }
  }
}
