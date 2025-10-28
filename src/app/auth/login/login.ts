import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { FormHelperService } from '../../shared/services/form-helper.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthResponse, CodeRequiredResponse } from '../../shared/types/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');
  
  // Gestion des étapes de connexion
  loginStep = signal<'email' | 'password'>('email');
  loginMode = signal<'ADMIN_PASSWORD' | 'EMAIL_CODE' | null>(null);
  
  loginForm: FormGroup;
  email = signal('');

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: Authservice,
    private formHelper: FormHelperService
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', FormHelperService.emailValidator],
      password: ['']
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  getInputClasses(fieldName: string): string {
    return this.formHelper.getInputClasses(fieldName, this.loginForm);
  }

  getFieldError(fieldName: string): string {
    return this.formHelper.getFieldError(fieldName, this.loginForm);
  }

  hasFieldError(fieldName: string): boolean {
    return this.formHelper.hasFieldError(fieldName, this.loginForm);
  }

  /**
   * Étape 1 : Soumission de l'email
   * - Si ADMIN : affiche le champ mot de passe
   * - Si CLIENT/INFLUENCEUR : envoie code et redirige vers page de vérification
   */
  onEmailSubmit(): void {
    const emailControl = this.loginForm.get('email');
    if (!emailControl || emailControl.invalid) {
      emailControl?.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    const emailValue = emailControl.value.trim();
    this.email.set(emailValue);

    this.authService.startLogin(emailValue).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.loginMode.set(response.mode);
        
        if (response.mode === 'ADMIN_PASSWORD') {
          // Admin : afficher le champ mot de passe
          this.showPasswordStep();
        } else {
          // Client/Influenceur : le code a déjà été envoyé, rediriger vers la page de vérification
          this.navigateToVerification(emailValue, 'magic');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la connexion'));
      }
    });
  }

  /**
   * Étape 2 : Soumission du mot de passe (pour ADMIN)
   * - Si mot de passe correct sans 2FA : connexion directe
   * - Si 2FA requis : envoie code et redirige vers page de vérification
   */
  onPasswordSubmit(): void {
    if (this.loginForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.loginForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login({
      email: this.email(),
      password: this.loginForm.value.password
    }).subscribe({
      next: (response: AuthResponse | CodeRequiredResponse) => {
        this.isLoading.set(false);
        
        // Vérifier si c'est une réponse 2FA (status CODE_REQUIRED dans le body)
        if ('status' in response && response.status === 'CODE_REQUIRED') {
          this.navigateToVerification(this.email(), '2fa');
          return;
        }
        
        // Connexion réussie sans 2FA (ne devrait jamais arriver pour ADMIN/DEVELOPER)
        this.authService.saveAuthData(response as AuthResponse);
        this.redirectToDashboard();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Identifiants invalides'));
      }
    });
  }

  /**
   * Retour à l'étape email
   */
  backToEmail(): void {
    this.loginStep.set('email');
    this.loginMode.set(null);
    this.loginForm.get('password')?.clearValidators();
    this.loginForm.get('password')?.updateValueAndValidity();
    this.loginForm.get('password')?.reset();
    this.errorMessage.set('');
  }

  /**
   * Helper : Affiche l'étape mot de passe pour ADMIN
   */
  private showPasswordStep(): void {
    this.loginStep.set('password');
    this.loginForm.get('password')?.setValidators(FormHelperService.passwordValidator);
    this.loginForm.get('password')?.updateValueAndValidity();
  }

  /**
   * Helper : Navigation vers la page de vérification du code
   */
  private navigateToVerification(email: string, mode: 'magic' | '2fa'): void {
    localStorage.setItem('pendingVerificationEmail', email);
    localStorage.setItem('loginMode', mode);
    this.router.navigate(['/auth/verify'], { 
      queryParams: { email },
      replaceUrl: true 
    });
  }

  /**
   * Redirige vers la page d'accueil après connexion réussie
   */
  private redirectToDashboard(): void {
    this.router.navigate(['/'], { replaceUrl: true });
  }
}