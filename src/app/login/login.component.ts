import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<'student' | 'admin'>('student');
  registerOpen = signal(false);
  errorMessage = signal<string | null>(null);
  registerMessage = signal<string | null>(null);

  studentForm = this.fb.nonNullable.group({
    studentId: ['', Validators.required],
    password: ['', Validators.required]
  });

  adminForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  registerForm = this.fb.nonNullable.group({
    studentId: ['', Validators.required],
    studentName: ['', Validators.required],
    password: ['', Validators.required]
  });

  setMode(next: 'student' | 'admin') {
    this.mode.set(next);
    this.errorMessage.set(null);
  }

  toggleRegister() {
    this.registerOpen.update((v) => !v);
    this.registerMessage.set(null);
  }

  submitStudent() {
    if (this.studentForm.invalid) return;
    const { studentId, password } = this.studentForm.getRawValue();
    this.errorMessage.set(null);
    this.auth.loginStudent(studentId, password).subscribe({
      next: () => this.router.navigate(['/student-history']),
      error: (err: { error?: { error?: string } }) => {
        this.errorMessage.set(err.error?.error ?? 'Login failed.');
      }
    });
  }

  submitAdmin() {
    if (this.adminForm.invalid) return;
    const { username, password } = this.adminForm.getRawValue();
    this.errorMessage.set(null);
    this.auth.loginAdmin(username, password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (err: { error?: { error?: string } }) => {
        this.errorMessage.set(err.error?.error ?? 'Login failed.');
      }
    });
  }

  submitRegister() {
    if (this.registerForm.invalid) return;
    const raw = this.registerForm.getRawValue();
    this.registerMessage.set(null);
    this.auth.registerStudent(raw).subscribe({
      next: () => {
        this.registerMessage.set('Account created. You can sign in.');
        this.registerForm.reset();
      },
      error: (err: { error?: { error?: string } }) => {
        this.registerMessage.set(err.error?.error ?? 'Registration failed.');
      }
    });
  }
}
