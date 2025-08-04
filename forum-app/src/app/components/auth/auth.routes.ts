import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RegisterPasswordComponent } from './register-password/register-password.component';
import { AdminRegisterComponent } from './admin-register/admin-register.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'password/forgot-password',
    component: RegisterPasswordComponent
  },
  {
    path: 'admin/register',
    component: AdminRegisterComponent
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
