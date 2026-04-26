import { Component, inject, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { PokemonService, AttendanceRecord } from '../pokemon.service';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-pokemon-form',
  imports: [ReactiveFormsModule],
  templateUrl: './pokemon-form.component.html',
  styleUrl: './pokemon-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokemonFormComponent implements OnInit{
  private formBuilder = inject(FormBuilder);
    attendanceForm = this.formBuilder.nonNullable.group({
        studentName: ['', Validators.required],
        studentId: ['', Validators.required],
        status: this.formBuilder.nonNullable.control<AttendanceRecord['status']>('Present', Validators.required),
        remarks: [''],
    })

pokemonService = inject(PokemonService);
editingId = signal<string | null>(null);

ngOnInit(){
  this.pokemonService.fetchAttendance();
}

onSubmit(){
  if(this.attendanceForm.invalid) return;

  const data = this.attendanceForm.getRawValue() as AttendanceRecord;
  const currentId = this.editingId();
  const request = currentId
    ? this.pokemonService.updateAttendance(currentId, data)
    : this.pokemonService.createAttendance(data);

  request.subscribe({
    next: () => {
      this.pokemonService.fetchAttendance();
      this.resetForm();
    },
    error: (err) => console.error('Save failed', err)
  });
}

startEdit(record: AttendanceRecord) {
  this.editingId.set(record._id || null);
  this.attendanceForm.patchValue({
    studentName: record.studentName,
    studentId: record.studentId,
    status: record.status,
    remarks: record.remarks || ''
  });
}

deleteRecord(id?: string) {
  if (!id) return;
  this.pokemonService.deleteAttendance(id).subscribe({
    next: () => this.pokemonService.fetchAttendance(),
    error: (err) => console.error('Delete failed', err)
  });
}

resetForm() {
  this.editingId.set(null);
  this.attendanceForm.reset({
    studentName: '',
    studentId: '',
    status: 'Present',
    remarks: ''
  });
}

formatAttendanceDate(dateValue?: string) {
  if (!dateValue) return 'No timestamp';
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return 'Invalid timestamp';
  return parsedDate.toLocaleString();
}
}