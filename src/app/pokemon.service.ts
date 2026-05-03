import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AttendanceRecord {
  _id?: string;
  studentName: string;
  studentId: string;
  attendanceAt?: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks: string;
}

export interface StudentOption {
  studentId: string;
  studentName: string;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:3000/api';
  private readonly attendanceUrl = `${this.apiBase}/attendance`;

  /** Used by legacy pokemon-form; requires admin session. */
  attendanceList = signal<AttendanceRecord[]>([]);

  myAttendance = signal<AttendanceRecord[]>([]);
  adminAttendance = signal<AttendanceRecord[]>([]);

  fetchAttendance() {
    this.http.get<AttendanceRecord[]>(this.attendanceUrl).subscribe((data) => this.attendanceList.set(data));
  }

  fetchMyAttendance() {
    this.http.get<AttendanceRecord[]>(`${this.apiBase}/me/attendance`).subscribe({
      next: (data) => this.myAttendance.set(data),
      error: (err) => console.error('Failed to load your attendance', err)
    });
  }

  fetchAdminAttendance(filters: { studentId?: string; dateFrom?: string; dateTo?: string } = {}) {
    let params = new HttpParams();
    if (filters.studentId) params = params.set('studentId', filters.studentId);
    if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    this.http.get<AttendanceRecord[]>(`${this.apiBase}/admin/attendance`, { params }).subscribe({
      next: (data) => this.adminAttendance.set(data),
      error: (err) => console.error('Failed to load admin attendance', err)
    });
  }

  fetchAdminStudentOptions(): Observable<StudentOption[]> {
    return this.http.get<StudentOption[]>(`${this.apiBase}/admin/students`);
  }

  createAttendance(data: AttendanceRecord) {
    return this.http.post(this.attendanceUrl, data);
  }

  updateAttendance(id: string, data: AttendanceRecord) {
    return this.http.put(`${this.attendanceUrl}/${id}`, data);
  }

  deleteAttendance(id: string) {
    return this.http.delete(`${this.attendanceUrl}/${id}`);
  }
}
