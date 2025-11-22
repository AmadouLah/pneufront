import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authservice } from '../services/authservice';

export const livreurGuard: CanActivateFn = () => {
  const authService = inject(Authservice);
  const router = inject(Router);
  const user = authService.authUser();

  if (!user) {
    return router.createUrlTree(['/auth/login']);
  }

  return user.role === 'LIVREUR' ? true : router.createUrlTree(['/']);
};

