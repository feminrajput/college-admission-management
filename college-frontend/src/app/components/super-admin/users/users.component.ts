import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService, AdminUser } from '../../../services/user.service';
import { CollegeService, College } from '../../../services/college.service';

@Component({
  selector: 'app-super-admin-users',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class SuperAdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  colleges: College[] = [];
  loading = true;

  showModal = false;
  editMode = false;
  editId = '';
  form = {
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'college_admin' as 'super_admin' | 'college_admin',
    college: '',
    collegeName: '',
  };
  formError = '';
  saving = false;

  showConfirmModal = false;
  confirmUser: AdminUser | null = null;

  constructor(private userService: UserService, private collegeService: CollegeService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadUsers();
    this.loadColleges();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res.success) this.users = res.users;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadColleges() {
    this.collegeService.getColleges(true).subscribe({
      next: (res) => {
        if (res.success) this.colleges = res.colleges;
      },
    });
  }

  openCreateModal() {
    this.editMode = false;
    this.editId = '';
    this.form = { username: '', email: '', password: '', name: '', role: 'college_admin', college: '', collegeName: '' };
    this.formError = '';
    this.showModal = true;
  }

  openEditModal(user: AdminUser) {
    this.editMode = true;
    this.editId = user._id;
    this.form = {
      username: user.username,
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      college: user.college || '',
      collegeName: user.collegeName || '',
    };
    this.formError = '';
    this.showModal = true;
  }

  onCollegeChange() {
    const selected = this.colleges.find(c => c.code === this.form.college);
    this.form.collegeName = selected ? selected.name : '';
  }

  saveUser() {
    if (!this.form.username || !this.form.email || !this.form.name || !this.form.role) {
      this.formError = 'All required fields must be filled.';
      return;
    }
    if (!this.editMode && !this.form.password) {
      this.formError = 'Password is required for new users.';
      return;
    }
    if (this.form.role === 'college_admin' && !this.form.college) {
      this.formError = 'College is required for college admins.';
      return;
    }

    this.saving = true;
    this.formError = '';

    const data: any = {
      username: this.form.username,
      email: this.form.email,
      name: this.form.name,
      role: this.form.role,
      college: this.form.role === 'college_admin' ? this.form.college : null,
      collegeName: this.form.role === 'college_admin' ? this.form.collegeName : null,
    };
    if (this.form.password) data.password = this.form.password;

    const request = this.editMode
      ? this.userService.updateUser(this.editId, data)
      : this.userService.createUser(data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.cdr.detectChanges();
        this.loadUsers();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'An error occurred.';
        this.cdr.detectChanges();
      },
    });
  }

  confirmDeactivate(user: AdminUser) {
    this.confirmUser = user;
    this.showConfirmModal = true;
  }

  deactivateUser() {
    if (!this.confirmUser) return;
    this.userService.deleteUser(this.confirmUser._id).subscribe({
      next: () => {
        this.showConfirmModal = false;
        this.cdr.detectChanges();
        this.loadUsers();
      },
      error: (err) => {
        this.showConfirmModal = false;
        this.cdr.detectChanges();
        alert(err.error?.message || 'Error deactivating user');
      },
    });
  }

  toggleActive(user: AdminUser) {
    this.userService.updateUser(user._id, { isActive: !user.isActive }).subscribe({
      next: () => {
        this.cdr.detectChanges();
        this.loadUsers();
      },
    });
  }

  getRoleBadge(role: string): string {
    return role === 'super_admin' ? 'badge-purple' : 'badge-info';
  }

  getRoleLabel(role: string): string {
    return role === 'super_admin' ? 'Super Admin' : 'College Admin';
  }

  closeAllModals() {
    this.showModal = false;
    this.showConfirmModal = false;
  }
}
