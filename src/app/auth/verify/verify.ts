import { Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { FormHelperService } from '../../shared/services/form-helper.service';
import { VerificationRequest } from '../../shared/types/auth';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify.html',
  styleUrls: ['./verify.css', '../shared/auth-theme.css']
})
export class VerifyComponent implements OnDestroy {
  isLoading = signal(false);
  isResending = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  countdown = signal(20);
  canResend = signal(false);
  
  verificationForm: FormGroup;
  email = signal('');
  loginMode = signal<'magic' | '2fa' | 'oauth'>('magic');
  isOAuth = signal(false);
  
  private countdownTimerId: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: Authservice,
    private formHelper: FormHelperService
  ) {
    this.verificationForm = this.formBuilder.group({
      code: ['', FormHelperService.codeValidator]
    });

    // Récupérer l'email et le mode depuis les paramètres ou localStorage (normaliser en minuscules)
    const emailParam = (this.route.snapshot.queryParams['email'] || localStorage.getItem('pendingVerificationEmail') || '').toLowerCase().trim();
    this.email.set(emailParam);
    
    // Vérifier si c'est un flux OAuth2
    const oauthParam = this.route.snapshot.queryParams['oauth'];
    if (oauthParam === 'google') {
      this.isOAuth.set(true);
      this.loginMode.set('oauth');
      localStorage.setItem('loginMode', 'oauth');
    } else {
      const mode = localStorage.getItem('loginMode') as 'magic' | '2fa' | 'oauth' || 'magic';
      this.loginMode.set(mode);
      this.isOAuth.set(mode === 'oauth');
    }
    
    if (!emailParam) {
      this.router.navigate(['/auth/login'], { replaceUrl: true });
      return;
    }
    
    this.startCountdown();
  }

  getInputClasses(fieldName: string): string {
    return this.formHelper.getInputClasses(fieldName, this.verificationForm);
  }

  getFieldError(fieldName: string): string {
    return this.formHelper.getFieldError(fieldName, this.verificationForm);
  }

  hasFieldError(fieldName: string): boolean {
    return this.formHelper.hasFieldError(fieldName, this.verificationForm);
  }

  /**
   * Soumission du code de vérification
   */
  onSubmit(): void {
    if (!this.verificationForm.valid || !this.email()) {
      this.formHelper.markAllFieldsAsTouched(this.verificationForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const verificationData: VerificationRequest = {
      email: this.email(),
      code: this.verificationForm.value.code
    };

    // Choisir la bonne méthode selon le mode
    const verifyMethod = (this.loginMode() === 'magic' || this.loginMode() === 'oauth')
      ? this.authService.magicVerify(verificationData)
      : this.authService.verify(verificationData);

    verifyMethod.subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.authService.saveAuthData(response);
        this.clearStoredAuthData();
        this.redirectToHome();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Code de vérification invalide'));
      }
    });
  }

  /**
   * Renvoi du code (cooldown 20s, max 3 fois)
   */
  resendCode(): void {
    if (!this.email() || !this.canResend()) return;

    this.isResending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Pour magic login OU OAuth, utiliser magicStart, sinon resendVerification (2FA)
    const isClientFlow = this.loginMode() === 'magic' || this.loginMode() === 'oauth';
    const resendMethod = isClientFlow
      ? this.authService.magicStart(this.email())
      : this.authService.resendVerification({ email: this.email() });

    resendMethod.subscribe({
      next: () => {
        this.isResending.set(false);
        this.successMessage.set('Nouveau code envoyé à votre email');
        this.restartCountdown();
      },
      error: (error: HttpErrorResponse) => {
        this.isResending.set(false);
        const msg = this.formHelper.extractErrorMessage(error, 'Erreur lors du renvoi du code');
        this.errorMessage.set(msg);
        // Si le backend indique qu'un mot de passe local est requis, rediriger vers la page login
        if (msg && msg.includes('authentification par mot de passe')) {
          this.router.navigate(['/auth/login'], {
            queryParams: { email: this.email(), mode: 'ADMIN_PASSWORD' },
            replaceUrl: true,
          });
        }
      }
    });
  }

  /**
   * Retour à la page de connexion
   */
  backToLogin(): void {
    this.authService.clearAuthData();
    this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  /**
   * Helper : Nettoie les données d'authentification stockées
   */
  private clearStoredAuthData(): void {
    localStorage.removeItem('pendingVerificationEmail');
    localStorage.removeItem('loginMode');
  }

  /**
   * Redirige tous les utilisateurs vers la page d'accueil après vérification
   */
  private redirectToHome(): void {
    this.router.navigate(['/'], { replaceUrl: true });
  }

  private startCountdown(): void {
    this.clearCountdown();
    this.canResend.set(false);
    this.countdown.set(20);
    this.countdownTimerId = setInterval(() => {
      const value = this.countdown();
      if (value > 1) {
        this.countdown.set(value - 1);
      } else {
        this.clearCountdown();
        this.countdown.set(0);
        this.canResend.set(true);
      }
    }, 1000);
  }

  private restartCountdown(): void {
    this.startCountdown();
  }

  private clearCountdown(): void {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }
}
