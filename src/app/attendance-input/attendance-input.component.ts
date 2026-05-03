import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PokemonService, AttendanceRecord } from '../pokemon.service';

@Component({
  selector: 'app-attendance-input',
  imports: [ReactiveFormsModule],
  templateUrl: './attendance-input.component.html',
  styleUrl: './attendance-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceInputComponent {
  private formBuilder = inject(FormBuilder);
  private pokemonService = inject(PokemonService);

  attendanceForm = this.formBuilder.nonNullable.group({
    studentName: ['', Validators.required],
    studentId: ['', Validators.required],
    status: this.formBuilder.nonNullable.control<AttendanceRecord['status']>('Present', Validators.required),
    remarks: ['']
  });

  onSubmit() {
    if (this.attendanceForm.invalid) return;
    const data = this.attendanceForm.getRawValue() as AttendanceRecord;
    this.pokemonService.createAttendance(data).subscribe({
      next: () => this.resetForm(),
      error: (err) => console.error('Save failed', err)
    });
  }

  resetForm() {
    this.attendanceForm.reset({
      studentName: '',
      studentId: '',
      status: 'Present',
      remarks: ''
    });
  }
}
