import { Routes } from '@angular/router';
import { AttendanceInputComponent } from './attendance-input/attendance-input.component';
import { LoginComponent } from './login/login.component';
import { StudentHistoryComponent } from './student-history/student-history.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { adminAuthGuard, studentAuthGuard } from './auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'attendance-input', component: AttendanceInputComponent },
  { path: 'student-history', component: StudentHistoryComponent, canActivate: [studentAuthGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminAuthGuard] }
];
