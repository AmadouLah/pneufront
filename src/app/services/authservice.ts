import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environement';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  VerificationRequest,
  ResendVerificationRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
  MessageResponse,
} from '../shared/types/auth';

@Injectable({ providedIn: 'root' })
export class Authservice {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error:', error);
    
    if (error.status === 0) {
      return throwError(() => new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.'));
    }
    
    if (error.error instanceof ErrorEvent) {
      return throwError(() => new Error(`Erreur client: ${error.error.message}`));
    }
    
    return throwError(() => new Error(`Erreur serveur: ${error.status} - ${error.message}`));
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload)
      .pipe(catchError(this.handleError));
  }

  register(payload: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/register`, payload)
      .pipe(catchError(this.handleError));
  }

  verify(payload: VerificationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/verify`, payload)
      .pipe(catchError(this.handleError));
  }

  resendVerification(payload: ResendVerificationRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/resend`, payload)
      .pipe(catchError(this.handleError));
  }

  forgotPasswordRequest(payload: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgot-password/request`, payload)
      .pipe(catchError(this.handleError));
  }

  forgotPasswordConfirm(payload: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgot-password/confirm`, payload)
      .pipe(catchError(this.handleError));
  }

  refreshToken(payload: RefreshTokenRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, payload)
      .pipe(catchError(this.handleError));
  }

  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }).pipe(catchError(this.handleError));
  }

  // Méthodes pour les guards
  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      // Vérifier si le token est expiré
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  authUser(): any {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;
    
    try {
      return JSON.parse(userInfo);
    } catch (error) {
      return null;
    }
  }

  mustChangePassword(): boolean {
    // Pour PneuMali, pas de changement de mot de passe forcé
    // Cette méthode peut être étendue selon vos besoins métier
    return false;
  }
}

