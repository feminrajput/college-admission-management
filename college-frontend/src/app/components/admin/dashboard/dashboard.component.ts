import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { interval, Subscription, startWith, switchMap } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { StatsService, DashboardStats } from '../../../services/stats.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, BaseChartDirective, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStats = { total: 0, underReview: 0, approved: 0, rejected: 0, queryRaised: 0, todayCount: 0 };
  recentApplications: any[] = [];
  loading = true;
  private statsSubscription?: Subscription;

  doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Under Review', 'Approved', 'Rejected', 'Query Raised'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: ['#0ea5e9', '#10b981', '#ef4444', '#f59e0b'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 12 } } },
    },
  };

  constructor(private statsService: StatsService, public authService: AuthService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.statsSubscription = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.statsService.getStats())
      )
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.stats = res.stats;
            this.recentApplications = res.recentApplications;
            this.updateCharts();
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error polling admin stats:', err);
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy() {
    this.statsSubscription?.unsubscribe();
  }

  private updateCharts() {
    this.doughnutChartData = {
      ...this.doughnutChartData,
      datasets: [{
        ...this.doughnutChartData.datasets[0],
        data: [this.stats.underReview, this.stats.approved, this.stats.rejected, this.stats.queryRaised],
      }],
    };
  }

  loadStats() {
    this.loading = true;
    this.statsService.getStats().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.stats = res.stats;
          this.recentApplications = res.recentApplications;
          this.doughnutChartData = {
            ...this.doughnutChartData,
            datasets: [{
              ...this.doughnutChartData.datasets[0],
              data: [this.stats.underReview, this.stats.approved, this.stats.rejected, this.stats.queryRaised],
            }],
          };
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
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
