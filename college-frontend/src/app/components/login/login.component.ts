import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface LoginConfig {
  title: string;
  subtitle: string;
  themeClass: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  showPassword = false;
  loginError = '';
  loading = false;
  role: string | null = null;

  activeConfig: LoginConfig = {
    title: 'Global University',
    subtitle: 'Admissions Portal',
    themeClass: 'default-theme',
    description: 'Manage admissions, review applications, and oversee college operations from a single unified dashboard.',
    icon: 'M12 14l9-5-9-5-9 5 9 5z'
  };

  private readonly configs: Record<string, LoginConfig> = {
    college: {
      title: 'College Admin',
      subtitle: 'Institution Portal',
      themeClass: 'college-theme',
      description: 'Access your institution\'s dashboard to manage department-specific admissions and student applications.',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
    university: {
      title: 'University Admin',
      subtitle: 'Super Admin Portal',
      themeClass: 'university-theme',
      description: 'Complete oversight of university-wide admissions, college management, and system-level configurations.',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    }
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.getDashboardRoute()]);
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.role = params['role'];
      if (this.role && this.configs[this.role]) {
        this.activeConfig = this.configs[this.role];
      }
    });
  }

  login() {
    if (!this.username || !this.password) {
      this.loginError = 'Please enter both username and password.';
      return;
    }

    this.loading = true;
    this.loginError = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate([this.authService.getDashboardRoute()]);
        } else {
          this.loginError = res.message || 'Login failed.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.loginError = err.error?.message || 'Invalid credentials. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.login();
    }
  }
}
