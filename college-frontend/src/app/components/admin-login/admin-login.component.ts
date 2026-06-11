import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  username = '';
  password = '';
  showPassword = false;
  loginError = false;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // If already logged in, redirect to dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.authService.getDashboardRoute()]);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    if (!this.username || !this.password) {
      this.loginError = true;
      return;
    }
    this.loading = true;
    this.loginError = false;

    this.authService.login(this.username.trim(), this.password.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate([this.authService.getDashboardRoute()]);
        } else {
          this.loginError = true;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.loginError = true;
        this.cdr.detectChanges();
      }
    });
  }
}
