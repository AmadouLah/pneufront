import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../environment';
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
  StartLoginResponse,
  CodeRequiredResponse,
} from '../shared/types/auth';

@Injectable({ providedIn: 'root' })
export class Authservice {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    console.error('HTTP Error:', error);
    return throwError(() => error);
  }

  /**
   * Démarre le processus de connexion et détermine le mode d'authentification
   * @param email Email de l'utilisateur
   * @returns Mode de connexion (ADMIN_PASSWORD ou EMAIL_CODE)
   */
  startLogin(email: string): Observable<StartLoginResponse> {
    return this.http.post<StartLoginResponse>(`${this.baseUrl}/start`, { email })
      .pipe(catchError(this.handleError));
  }

  /**
   * Connexion classique avec email + mot de passe (pour ADMIN/DEVELOPER)
   * @param payload Credentials (email + password)
   * @returns AuthResponse (connexion directe) ou CodeRequiredResponse (si 2FA requis - status HTTP 202)
   */
  login(payload: LoginRequest): Observable<AuthResponse | CodeRequiredResponse> {
    return this.http.post<AuthResponse | CodeRequiredResponse>(`${this.baseUrl}/login`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Démarre la connexion par email (magic link) pour CLIENT/INFLUENCEUR
   * Envoie un code à 6 chiffres par email
   * @param email Email de l'utilisateur
   */
  magicStart(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/magic/start`, { email })
      .pipe(catchError(this.handleError));
  }

  /**
   * Vérifie le code magic et connecte l'utilisateur
   * @param payload Email + code à 6 chiffres
   */
  magicVerify(payload: VerificationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/magic/verify`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * @deprecated Utiliser startLogin + magicStart/login selon le mode
   */
  register(payload: RegisterRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/register`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Vérifie le code de vérification (utilisé pour 2FA admin)
   * @param payload Email + code
   */
  verify(payload: VerificationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/verify`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Renvoie un code de vérification (cooldown 20s, max 3 fois)
   * @param payload Email
   */
  resendVerification(payload: ResendVerificationRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/resend`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Demande de réinitialisation de mot de passe (pour ADMIN/DEVELOPER uniquement)
   * @param payload Email
   */
  forgotPasswordRequest(payload: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgot-password/request`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Confirme la réinitialisation avec le code reçu
   * @param payload Email + code + nouveau mot de passe
   */
  forgotPasswordConfirm(payload: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/forgot-password/confirm`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Renouvelle le token d'accès
   * @param payload Refresh token
   */
  refreshToken(payload: RefreshTokenRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/refresh`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * Déconnexion
   * @param refreshToken Token de rafraîchissement
   */
  logout(refreshToken: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    }).pipe(catchError(this.handleError));
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Récupère les informations de l'utilisateur connecté
   */
  authUser(): any {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) return null;
    
    try {
      return JSON.parse(userInfo);
    } catch (error) {
      return null;
    }
  }

  /**
   * Stocke les informations d'authentification
   * @param response Réponse d'authentification
   */
  saveAuthData(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('userInfo', JSON.stringify(response.userInfo));
  }

  /**
   * Nettoie les données d'authentification
   */
  clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('pendingVerificationEmail');
    localStorage.removeItem('loginMode');
  }

  mustChangePassword(): boolean {
    return false;
  }
}

