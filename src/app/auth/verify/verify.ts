import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { VerificationRequest } from '../../shared/types/auth';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify.html',
  styleUrls: ['./verify.css']
})
export class VerifyComponent {

  isLoading = signal(false);
  isResending = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  countdown = signal(20);
  canResend = signal(false);
  
  verificationForm: FormGroup;
  email: string = '';
  private countdownTimerId: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: Authservice
  ) {
    this.verificationForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });

    // Récupérer l'email depuis les paramètres de route ou le localStorage
    this.email = this.route.snapshot.queryParams['email'] || localStorage.getItem('pendingVerificationEmail') || '';
    this.startCountdown();
  }

  getInputClasses(fieldName: string): string {
    const baseClasses = 'w-full px-4 py-3 pl-12 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200';
    const errorClasses = this.hasFieldError(fieldName) ? 'border-red-500' : 'border-gray-600';
    return `${baseClasses} ${errorClasses}`;
  }

  getFieldError(fieldName: string): string {
    const field = this.verificationForm.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    const errorMessages = this.getErrorMessages(fieldName);
    const errorKey = Object.keys(field.errors)[0];
    return errorMessages[errorKey] || '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.verificationForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private getErrorMessages(fieldName: string): Record<string, string> {
    const errorMessages: Record<string, Record<string, string>> = {
      code: {
        required: 'Le code de vérification est obligatoire',
        minlength: 'Le code doit contenir 6 chiffres',
        maxlength: 'Le code doit contenir 6 chiffres'
      }
    };
    return errorMessages[fieldName] || {};
  }

  onSubmit(): void {
    if (this.verificationForm.valid && this.email) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const verificationData: VerificationRequest = {
        email: this.email,
        code: this.verificationForm.value.code
      };

      this.authService.verify(verificationData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          // Nettoyer et rediriger immédiatement vers la page d'authentification
          localStorage.removeItem('pendingVerificationEmail');
          this.router.navigate(['/auth/login'], { replaceUrl: true });
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Verification error details:', error);
          const message = error?.error?.message || error?.message || 'Code de vérification invalide';
          this.errorMessage.set(message);
        }
      });
    } else {
      Object.keys(this.verificationForm.controls).forEach(key => {
        this.verificationForm.get(key)?.markAsTouched();
      });
    }
  }

  resendCode(): void {
    if (this.email) {
      this.isResending.set(true);
      this.errorMessage.set('');
      this.authService.resendVerification({ email: this.email }).subscribe({
        next: () => {
          this.isResending.set(false);
          this.successMessage.set('Nouveau code envoyé à votre email');
          this.restartCountdown();
        },
        error: (error) => {
          this.isResending.set(false);
          const message = error?.error?.message || error?.message || 'Erreur lors du renvoi du code';
          this.errorMessage.set(message);
        }
      });
    }
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
