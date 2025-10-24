import { CanActivateFn } from '@angular/router';
import { Authservice } from '../services/authservice';
import { inject } from '@angular/core';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(Authservice);
  if (!authService.isLoggedIn()) {
    return true;
  }
  return false;
};
