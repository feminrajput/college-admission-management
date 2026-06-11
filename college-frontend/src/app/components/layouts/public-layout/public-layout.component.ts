import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.css',
})
export class PublicLayoutComponent implements OnInit {
  mobileMenuOpen = false;
  portalDropdownOpen = false;

  constructor(public authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Auto-close dropdown and mobile menu on every route navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.portalDropdownOpen = false;
      this.mobileMenuOpen = false;
      window.scrollTo(0, 0);
    });
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  togglePortalDropdown() {
    this.portalDropdownOpen = !this.portalDropdownOpen;
  }

  closePortalDropdown() {
    this.portalDropdownOpen = false;
  }

  navigateToLogin(role?: string) {
    this.closePortalDropdown();
    this.closeMobileMenu();
    const queryParams = role ? { role } : {};
    this.router.navigate(['/login'], { queryParams });
  }

  navigateToDashboard() {
    this.closePortalDropdown();
    this.closeMobileMenu();
    this.router.navigate([this.authService.getDashboardRoute()]);
  }

  scrollToSection(sectionId: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.closeMobileMenu();
    this.closePortalDropdown();

    const scrollTo = () => {
      // Small delay to let the DOM render after navigation
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const navbarHeight = 64; // fixed navbar height
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - navbarHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    };

    // If we're not on the home page, navigate there first
    if (this.router.url !== '/') {
      this.router.navigate(['/']).then(() => scrollTo());
    } else {
      scrollTo();
    }
  }
}
