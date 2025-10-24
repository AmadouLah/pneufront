import { CanActivateFn, Router } from '@angular/router';
import { Authservice } from '../services/authservice';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(Authservice);
  const router = inject(Router);
  const user = authService.authUser();
  if (!user) {
    return router.createUrlTree(['/auth/login']);
  }
  const rolesAutorises = ['ADMIN'];
  return rolesAutorises.includes(user.role)
    ? true
    : router.createUrlTree(['/auth/login']);
};
