import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CollegeService, College } from '../../../services/college.service';

@Component({
  selector: 'app-super-admin-colleges',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './colleges.component.html',
  styleUrl: './colleges.component.css',
})
export class SuperAdminCollegesComponent implements OnInit {
  colleges: College[] = [];
  loading = true;

  // Create/Edit modal
  showModal = false;
  editMode = false;
  editId = '';
  form = {
    name: '',
    code: '',
    description: '',
    departments: '',
    programs: '',
    icon: 'school',
  };
  formError = '';
  saving = false;

  // Confirm modal
  showConfirmModal = false;
  confirmCollege: College | null = null;

  constructor(private collegeService: CollegeService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadColleges();
  }

  loadColleges() {
    this.loading = true;
    this.collegeService.getColleges(true).subscribe({
      next: (res) => {
        if (res.success) this.colleges = res.colleges;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openCreateModal() {
    this.editMode = false;
    this.editId = '';
    this.form = { name: '', code: '', description: '', departments: '', programs: '', icon: 'school' };
    this.formError = '';
    this.showModal = true;
  }

  openEditModal(college: College) {
    this.editMode = true;
    this.editId = college._id;
    this.form = {
      name: college.name,
      code: college.code,
      description: college.description,
      departments: college.departments.join(', '),
      programs: college.programs.join(', '),
      icon: college.icon,
    };
    this.formError = '';
    this.showModal = true;
  }

  saveCollege() {
    if (!this.form.name || !this.form.code) {
      this.formError = 'Name and code are required.';
      return;
    }
    this.saving = true;
    this.formError = '';

    const data: any = {
      name: this.form.name,
      code: this.form.code,
      description: this.form.description,
      departments: this.form.departments.split(',').map(s => s.trim()).filter(s => s),
      programs: this.form.programs.split(',').map(s => s.trim()).filter(s => s),
      icon: this.form.icon,
    };

    const request = this.editMode
      ? this.collegeService.updateCollege(this.editId, data)
      : this.collegeService.createCollege(data);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.cdr.detectChanges();
        this.loadColleges();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'An error occurred.';
        this.cdr.detectChanges();
      },
    });
  }

  confirmDeactivate(college: College) {
    this.confirmCollege = college;
    this.showConfirmModal = true;
  }

  deactivateCollege() {
    if (!this.confirmCollege) return;
    this.collegeService.deleteCollege(this.confirmCollege._id).subscribe({
      next: () => {
        this.showConfirmModal = false;
        this.cdr.detectChanges();
        this.loadColleges();
      },
    });
  }

  toggleActive(college: College) {
    this.collegeService.updateCollege(college._id, { isActive: !college.isActive } as any).subscribe({
      next: () => {
        this.cdr.detectChanges();
        this.loadColleges();
      },
    });
  }

  closeAllModals() {
    this.showModal = false;
    this.showConfirmModal = false;
  }
}
