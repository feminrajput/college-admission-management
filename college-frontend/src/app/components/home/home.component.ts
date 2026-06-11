import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CollegeService, College, PublicStats } from '../../services/college.service';
import { interval, Subscription, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  colleges: College[] = [];
  stats: PublicStats = {
    totalApplications: 0,
    activeColleges: 0,
    totalPrograms: 0,
    totalDepts: 0
  };
  private statsSubscription?: Subscription;
  private collegesSubscription?: Subscription;

  currentSlide = 0;
  selectedCollege: College | null = null;

  constructor(
    private collegeService: CollegeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Fetch colleges once
    this.collegesSubscription = this.collegeService.getColleges().subscribe({
      next: (res) => {
        if (res.success) {
          this.colleges = res.colleges;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error fetching colleges:', err);
      },
    });

    // Polling stats every 30 seconds
    this.statsSubscription = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() => this.collegeService.getPublicStats())
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.stats = res.stats;
            this.cdr.markForCheck();
          }
        },
        error: (err) => console.error('Error polling stats:', err),
      });
  }

  ngOnDestroy() {
    this.statsSubscription?.unsubscribe();
    this.collegesSubscription?.unsubscribe();
  }

  getCollegeIcon(icon: string): string {
    const icons: Record<string, string> = {
      cpu: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
      computer: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
      palette: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
      briefcase: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      account_balance: 'M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
      flask: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      science: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
      school: 'M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    };
    return icons[icon] || icons['school'];
  }

  getCollegeColor(index: number): { bg: string; text: string; border: string } {
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    ];
    return colors[index % colors.length];
  }

  scrollToColleges() {
    setTimeout(() => {
      const element = document.getElementById('colleges');
      if (element) {
        const navbarHeight = 64; // fixed navbar height
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - navbarHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  }

  nextSlide() {
    if (this.currentSlide < this.colleges.length - 1) {
      this.currentSlide++;
    } else {
      this.currentSlide = 0;
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    } else {
      this.currentSlide = this.colleges.length - 1;
    }
  }

  setSlide(index: number) {
    this.currentSlide = index;
  }

  openCollegeDetails(college: College) {
    this.selectedCollege = college;
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
  }

  closeCollegeDetails(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedCollege = null;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }
}
