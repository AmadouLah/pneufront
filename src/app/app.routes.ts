import { Routes } from '@angular/router';
import { authGuard } from './guard/auth-guard-guard';
import { loginGuard } from './guard/login-guard';
import { adminGuard } from './guard/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register/register').then(m => m.RegisterComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
    canActivate: [loginGuard]
  },
  {
    path: 'auth/verify',
    loadComponent: () => import('./auth/verify/verify').then(m => m.VerifyComponent),
    canActivate: [loginGuard]
  },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
