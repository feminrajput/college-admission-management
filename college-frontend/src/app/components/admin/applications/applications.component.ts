import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApplicationService, Application } from '../../../services/application.service';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.css',
})
export class AdminApplicationsComponent implements OnInit {
  applications: Application[] = [];
  filtered: Application[] = [];
  loading = true;

  searchTerm = '';
  statusFilter = 'all';
  programFilter = 'all';
  sortBy = 'dateDesc';
  showAdvancedFilters = false;
  startDateFilter = '';
  endDateFilter = '';
  uniquePrograms: string[] = [];

  // View modal
  viewApp: Application | null = null;
  showViewModal = false;

  // Query modal
  queryApp: Application | null = null;
  queryMessage = '';
  showQueryModal = false;
  queryLoading = false;

  // Confirm modal
  confirmAction = '';
  confirmApp: Application | null = null;
  showConfirmModal = false;
  confirmLoading = false;

  // Pagination
  page = 1;
  pageSize = 10;

  constructor(private appService: ApplicationService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loading = true;
    this.appService.getAllApplications().subscribe({
      next: (res) => {
        if (res.success) {
          this.applications = res.applications || [];
          this.uniquePrograms = [...new Set(this.applications.map(a => a.program).filter(p => p))];
          this.applyFilters();
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

  applyFilters() {
    let result = [...this.applications];
    if (this.statusFilter !== 'all') {
      result = result.filter(a => a.status === this.statusFilter);
    }
    if (this.programFilter !== 'all') {
      result = result.filter(a => a.program === this.programFilter);
    }
    if (this.startDateFilter) {
      result = result.filter(a => a.submittedOn && a.submittedOn >= this.startDateFilter);
    }
    if (this.endDateFilter) {
      result = result.filter(a => a.submittedOn && a.submittedOn <= this.endDateFilter);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a =>
        a.applicationId.toLowerCase().includes(term) ||
        a.name.toLowerCase().includes(term) ||
        a.program.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      if (this.sortBy === 'dateDesc') {
        return new Date(b.submittedOn || 0).getTime() - new Date(a.submittedOn || 0).getTime();
      } else if (this.sortBy === 'dateAsc') {
        return new Date(a.submittedOn || 0).getTime() - new Date(b.submittedOn || 0).getTime();
      } else if (this.sortBy === 'nameAsc') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (this.sortBy === 'nameDesc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      return 0;
    });

    this.filtered = result;
    this.page = 1;
  }

  get paginatedApps(): Application[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filtered.length / this.pageSize);
  }

  // Actions
  viewApplication(app: Application) {
    this.viewApp = app;
    this.showViewModal = true;
  }

  approveApplication(app: Application) {
    this.confirmApp = app;
    this.confirmAction = 'approve';
    this.showConfirmModal = true;
  }

  rejectApplication(app: Application) {
    this.confirmApp = app;
    this.confirmAction = 'reject';
    this.showConfirmModal = true;
  }

  openQueryModal(app: Application) {
    this.queryApp = app;
    this.queryMessage = '';
    this.showQueryModal = true;
  }

  confirmActionExecute() {
    if (!this.confirmApp || this.confirmLoading) return;
    this.confirmLoading = true;
    const status = this.confirmAction === 'approve' ? 'Approved' : 'Rejected';
    this.appService.updateApplicationStatus(this.confirmApp.applicationId, status).subscribe({
      next: () => {
        this.showConfirmModal = false;
        this.confirmLoading = false;
        this.loadApplications();
        this.cdr.detectChanges();
      },
      error: () => {
        this.confirmLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitQuery() {
    if (!this.queryApp || !this.queryMessage.trim() || this.queryLoading) return;
    this.queryLoading = true;
    this.appService.updateApplicationStatus(this.queryApp.applicationId, 'Query Raised', this.queryMessage).subscribe({
      next: () => {
        this.showQueryModal = false;
        this.queryLoading = false;
        this.loadApplications();
        this.cdr.detectChanges();
      },
      error: () => {
        this.queryLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteApplication(app: Application) {
    this.confirmApp = app;
    this.confirmAction = 'delete';
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (!this.confirmApp) return;
    this.appService.deleteApplication(this.confirmApp.applicationId).subscribe({
      next: () => {
        this.showConfirmModal = false;
        this.loadApplications();
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

  closeAllModals() {
    this.showViewModal = false;
    this.showQueryModal = false;
    this.showConfirmModal = false;
  }

  getDocUrl(relativePath: string): string {
    return `${environment.staticUrl}${relativePath}`;
  }
}
