import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Intercepteur HTTP qui ajoute automatiquement le token JWT aux requêtes
 */
export const authinterceptorInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  // Si un token existe, l'ajouter au header Authorization
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }
  
  return next(req);
};

