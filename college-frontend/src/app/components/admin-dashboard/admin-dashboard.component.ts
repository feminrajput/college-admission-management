import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApplicationService, Application } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  applications: Application[] = [];
  searchTerm = '';
  statusFilter = 'ALL';
  loadError = '';

  // Query Modal
  queryModalOpen = false;
  currentQueryAppId = '';
  queryText = '';

  // View Modal
  viewModalOpen = false;
  viewApp: any = null;
  viewAppData: any = {};

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loadError = '';
    this.applicationService.getAllApplications().subscribe({
      next: (data) => {
        if (data.success) {
          this.applications = data.applications || [];
        } else {
          this.loadError = data.message || 'Failed to load applications';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadError = err.error?.message || err.message || 'Failed to load applications from server.';
        this.cdr.detectChanges();
      }
    });
  }

  get filteredApplications(): Application[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.applications.filter(app => {
      const matchesSearch = !search ||
        (app.applicationId && app.applicationId.toLowerCase().includes(search)) ||
        (app.name && app.name.toLowerCase().includes(search));
      const matchesStatus = this.statusFilter === 'ALL' || app.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  statusBadgeClass(status: string): string {
    const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ';
    switch (status) {
      case 'Approved':
        return base + 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return base + 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Query Raised':
        return base + 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return base + 'bg-sky-50 text-sky-700 border-sky-200';
    }
  }

  formatDate(dateStr: string): string {
    return dateStr || '-';
  }

  // Actions
  approveApplication(appId: string): void {
    this.applicationService.updateApplicationStatus(appId, 'Approved').subscribe({
      next: () => { this.loadApplications(); this.cdr.detectChanges(); },
      error: (err) => { alert('Error updating status: ' + (err.error?.message || err.message)); this.cdr.detectChanges(); }
    });
  }

  rejectApplication(appId: string): void {
    this.applicationService.updateApplicationStatus(appId, 'Rejected').subscribe({
      next: () => { this.loadApplications(); this.cdr.detectChanges(); },
      error: (err) => { alert('Error updating status: ' + (err.error?.message || err.message)); this.cdr.detectChanges(); }
    });
  }

  deleteApplication(appId: string): void {
    const trimmedId = (appId || '').trim();
    if (!trimmedId) {
      alert('Invalid application ID.');
      return;
    }
    if (!confirm(`Are you sure you want to delete Application ID: ${trimmedId}?`)) {
      return;
    }
    this.applicationService.deleteApplication(trimmedId).subscribe({
      next: (data) => {
        if (data.success) {
          alert('Application deleted successfully!');
          this.loadApplications();
        } else {
          alert('Error deleting application: ' + (data.message || 'Please try again.'));
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Error deleting application: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  // Query Modal
  openQueryModal(appId: string): void {
    this.currentQueryAppId = appId;
    this.queryText = '';
    this.queryModalOpen = true;
  }

  closeQueryModal(): void {
    this.queryModalOpen = false;
    this.currentQueryAppId = '';
  }

  sendQuery(): void {
    if (!this.currentQueryAppId) return;
    const text = this.queryText.trim();
    if (!text) {
      alert('Please enter a query message.');
      return;
    }
    this.applicationService.updateApplicationStatus(this.currentQueryAppId, 'Query Raised', text).subscribe({
      next: () => {
        this.loadApplications();
        this.closeQueryModal();
        this.cdr.detectChanges();
      },
      error: (err) => { alert('Error sending query: ' + (err.error?.message || err.message)); this.cdr.detectChanges(); }
    });
  }

  // View Modal
  openViewModal(appId: string): void {
    this.applicationService.getApplicationById(appId).subscribe({
      next: (data) => {
        if (data.success && data.application) {
          this.viewApp = data.application;
          const d = data.application.data || {};
          this.viewAppData = {
            p: d.personalInfo || {},
            c: d.contactInfo || {},
            a: d.academicBackground || {},
            ps: d.programSelection || {},
            docs: d.documents || {}
          };
          this.viewModalOpen = true;
        } else {
          alert('Failed to load application details.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => { alert('Error loading application details: ' + (err.error?.message || err.message)); this.cdr.detectChanges(); }
    });
  }

  closeViewModal(): void {
    this.viewModalOpen = false;
    this.viewApp = null;
  }

  onViewModalBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeViewModal();
    }
  }

  onQueryModalBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeQueryModal();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/admin-login']);
  }

  getDocUrl(relativePath: string): string {
    return `${environment.staticUrl}${relativePath}`;
  }
}
