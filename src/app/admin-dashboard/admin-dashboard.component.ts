import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PokemonService, StudentOption } from '../pokemon.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  pokemonService = inject(PokemonService);

  studentOptions = signal<StudentOption[]>([]);

  filterForm = this.fb.nonNullable.group({
    studentId: [''],
    dateFrom: [''],
    dateTo: ['']
  });

  ngOnInit() {
    this.pokemonService.fetchAdminStudentOptions().subscribe({
      next: (list) => this.studentOptions.set(list)
    });
    this.applyFilters();
  }

  applyFilters() {
    const v = this.filterForm.getRawValue();
    this.pokemonService.fetchAdminAttendance({
      studentId: v.studentId || undefined,
      dateFrom: v.dateFrom || undefined,
      dateTo: v.dateTo || undefined
    });
  }

  clearFilters() {
    this.filterForm.reset({ studentId: '', dateFrom: '', dateTo: '' });
    this.applyFilters();
  }

  refreshLists() {
    const v = this.filterForm.getRawValue();
    this.pokemonService.fetchAdminAttendance({
      studentId: v.studentId || undefined,
      dateFrom: v.dateFrom || undefined,
      dateTo: v.dateTo || undefined
    });
    this.pokemonService.fetchAdminStudentOptions().subscribe({
      next: (list) => this.studentOptions.set(list)
    });
  }

  deleteRecord(id?: string) {
    if (!id) return;
    this.pokemonService.deleteAttendance(id).subscribe({
      next: () => this.refreshLists(),
      error: (err) => console.error('Delete failed', err)
    });
  }

  formatAttendanceDate(dateValue?: string) {
    if (!dateValue) return 'No timestamp';
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return 'Invalid timestamp';
    return parsedDate.toLocaleString();
  }
}
