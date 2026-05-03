import { computed, Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, tap } from 'rxjs/operators';

export interface AuthUser {
  role: 'student' | 'admin';
  studentId?: string;
  studentName?: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiBase = 'http://localhost:3000/api';
  private readonly storageKey = 'attendance_auth_v1';

  readonly token = signal<string | null>(null);
  readonly user = signal<AuthUser | null>(null);

  readonly isStudent = computed(() => this.user()?.role === 'student');
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
      if (parsed?.token && parsed?.user) {
        this.token.set(parsed.token);
        this.user.set(parsed.user);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }

  private persist(sessionToken: string, authUser: AuthUser) {
    sessionStorage.setItem(this.storageKey, JSON.stringify({ token: sessionToken, user: authUser }));
    this.token.set(sessionToken);
    this.user.set(authUser);
  }

  clearSession() {
    sessionStorage.removeItem(this.storageKey);
    this.token.set(null);
    this.user.set(null);
  }

  loginStudent(studentId: string, password: string) {
    return this.http.post<{ token: string; user: AuthUser }>(`${this.apiBase}/auth/login-student`, { studentId, password }).pipe(
      tap((res) => this.persist(res.token, res.user))
    );
  }

  loginAdmin(username: string, password: string) {
    return this.http.post<{ token: string; user: AuthUser }>(`${this.apiBase}/auth/login-admin`, { username, password }).pipe(
      tap((res) => this.persist(res.token, res.user))
    );
  }

  registerStudent(body: { studentId: string; studentName: string; password: string }) {
    return this.http.post<{ message?: string }>(`${this.apiBase}/auth/register-student`, body);
  }

  logout() {
    const tok = this.token();
    if (!tok) {
      this.clearSession();
      return;
    }
    this.http.post(`${this.apiBase}/auth/logout`, {}).pipe(finalize(() => this.clearSession())).subscribe({
      error: () => {
        /* session cleared in finalize */
      }
    });
  }
}
