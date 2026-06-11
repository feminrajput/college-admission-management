import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './super-admin-layout.component.html',
  styleUrl: './super-admin-layout.component.css',
})
export class SuperAdminLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  user: any = null;

  constructor(public authService: AuthService, private router: Router) {
    this.user = this.authService.getUser();
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo(0, 0);
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}
