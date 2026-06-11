import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApplicationService, Application } from '../../services/application.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-status-checker',
  imports: [CommonModule, FormsModule],
  templateUrl: './status-checker.component.html',
  styleUrl: './status-checker.component.css'
})
export class StatusCheckerComponent {
  activeTab: 'id' | 'email' = 'id';
  appId = '';
  emailInput = '';

  resultFound = false;
  notFound = false;
  notFoundText = '';
  searching = false;

  // Result data
  resId = '';
  resName = '';
  resProgram = '';
  resSubmitted = '';
  resStatus = '';
  resQueryMessage = '';

  constructor(
    private applicationService: ApplicationService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  showIdTab(): void {
    this.activeTab = 'id';
    this.resultFound = false;
    this.notFound = false;
  }

  showEmailTab(): void {
    this.activeTab = 'email';
    this.resultFound = false;
    this.notFound = false;
  }

  getStatusBadgeClasses(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'Query Raised':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      default:
        return 'bg-sky-100 text-sky-800 border border-sky-200';
    }
  }

  renderApplication(app: Application): void {
    this.resId = app.applicationId || '-';
    this.resName = app.name || '-';
    this.resProgram = app.program || '-';
    this.resSubmitted = app.submittedOn || '-';
    this.resStatus = app.status || 'Under Review';
    this.resQueryMessage = app.queryMessage || '';
    this.resultFound = true;
    this.notFound = false;
  }

  searchById(): void {
    const id = this.appId.trim();
    this.resultFound = false;
    this.notFound = false;
    if (!id) {
      this.notFoundText = 'Please enter a valid Application ID.';
      this.notFound = true;
      return;
    }

    this.searching = true;
    this.applicationService.getApplicationById(id).pipe(
      finalize(() => {
        this.searching = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        if (data.success && data.application) {
          this.renderApplication(data.application);
        } else {
          this.notFoundText = 'We could not find an application with that ID. Please check your Application ID or contact Admissions.';
          this.notFound = true;
        }
      },
      error: (err) => {
        this.notFoundText = err.error?.message || 'Connection error. Please try again later.';
        this.notFound = true;
      }
    });
  }

  searchByEmail(): void {
    const email = this.emailInput.trim();
    this.resultFound = false;
    this.notFound = false;

    if (!email) {
      this.notFoundText = 'Please enter your registered email address.';
      this.notFound = true;
      this.cdr.detectChanges();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.notFoundText = 'Please enter a valid email address format (e.g., user@example.com).';
      this.notFound = true;
      this.cdr.detectChanges();
      return;
    }

    this.searching = true;
    this.applicationService.getApplicationByEmail(email).pipe(
      finalize(() => {
        this.searching = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        if (data.success && data.application) {
          this.renderApplication(data.application);
        } else {
          this.notFoundText = data.message || 'We could not find an application with that email. Please check your email or contact Admissions.';
          this.notFound = true;
        }
      },
      error: (err) => {
        console.error('Email search error:', err);
        this.notFoundText = err.error?.message || 'Connection error. Please try again later or contact support if the issue persists.';
        this.notFound = true;
      }
    });
  }

  reopenApplication(): void {
    this.router.navigate(['/apply'], { queryParams: { edit: this.resId } });
  }
}
