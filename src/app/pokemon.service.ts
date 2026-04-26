import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AttendanceRecord {
  _id?: string;
  studentName: string;
  studentId: string;
  attendanceAt?: string;
  status: 'Present' | 'Absent' | 'Late';
  remarks: string;
}

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/attendance';

  attendanceList = signal<AttendanceRecord[]>([]);

  fetchAttendance() {
    this.http.get<AttendanceRecord[]>(this.apiUrl).subscribe(data => this.attendanceList.set(data));
  }

  createAttendance(data: AttendanceRecord) {
    return this.http.post(this.apiUrl, data);
  }

  updateAttendance(id: string, data: AttendanceRecord) {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteAttendance(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
