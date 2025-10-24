import { CanActivateFn } from '@angular/router';
import { Authservice } from '../services/authservice';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Authservice);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    const cible = (route.data && route.data['redirectTo']) || '/auth/login';
    return router.createUrlTree([cible], { queryParams: { returnUrl: state.url } });
  }

  return true;
};
