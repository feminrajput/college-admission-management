import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

// Layouts
import { PublicLayoutComponent } from './components/layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './components/layouts/admin-layout/admin-layout.component';
import { SuperAdminLayoutComponent } from './components/layouts/super-admin-layout/super-admin-layout.component';

// Public pages
import { HomeComponent } from './components/home/home.component';
import { ApplicationPortalComponent } from './components/application-portal/application-portal.component';
import { StatusCheckerComponent } from './components/status-checker/status-checker.component';
import { LoginComponent } from './components/login/login.component';

// College Admin pages
import { AdminDashboardComponent } from './components/admin/dashboard/dashboard.component';
import { AdminApplicationsComponent } from './components/admin/applications/applications.component';

// Super Admin pages
import { SuperAdminDashboardComponent } from './components/super-admin/dashboard/dashboard.component';
import { SuperAdminApplicationsComponent } from './components/super-admin/applications/applications.component';
import { SuperAdminCollegesComponent } from './components/super-admin/colleges/colleges.component';
import { SuperAdminUsersComponent } from './components/super-admin/users/users.component';
import { SuperAdminSettingsComponent } from './components/super-admin/settings/settings.component';

export const routes: Routes = [
  // Public routes with shared layout
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'apply', component: ApplicationPortalComponent },
      { path: 'status', component: StatusCheckerComponent },
    ],
  },

  // Login (no layout wrapper)
  { path: 'login', component: LoginComponent },

  // Legacy routes (redirect to new paths)
  { path: 'admin-login', redirectTo: 'login', pathMatch: 'full' },
  { path: 'admin-dashboard', redirectTo: 'admin/dashboard', pathMatch: 'full' },

  // College Admin routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    data: { role: 'college_admin' },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'applications', component: AdminApplicationsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Super Admin routes
  {
    path: 'super-admin',
    component: SuperAdminLayoutComponent,
    canActivate: [authGuard],
    data: { role: 'super_admin' },
    children: [
      { path: 'dashboard', component: SuperAdminDashboardComponent },
      { path: 'applications', component: SuperAdminApplicationsComponent },
      { path: 'colleges', component: SuperAdminCollegesComponent },
      { path: 'users', component: SuperAdminUsersComponent },
      { path: 'settings', component: SuperAdminSettingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
