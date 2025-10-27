import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { ForgotPasswordRequest, ResetPasswordRequest } from '../../shared/types/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {

  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  currentStep = signal(1);
  errorMessage = signal('');
  successMessage = signal('');
  userEmail = signal('');
  
  forgotPasswordForm: FormGroup;
  resetPasswordForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: Authservice
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetPasswordForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  getInputClasses(fieldName: string): string {
    const baseClasses = 'w-full px-4 py-3 pl-12 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200';
    const errorClasses = this.hasFieldError(fieldName) ? 'border-red-500' : 'border-gray-600';
    const passwordClasses = fieldName === 'newPassword' || fieldName === 'confirmPassword' ? 'pr-12' : '';
    return `${baseClasses} ${errorClasses} ${passwordClasses}`;
  }

  getFieldError(fieldName: string): string {
    const form = this.currentStep() === 1 ? this.forgotPasswordForm : this.resetPasswordForm;
    const field = form.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    const errorMessages = this.getErrorMessages(fieldName);
    const errorKey = Object.keys(field.errors)[0];
    return errorMessages[errorKey] || '';
  }

  hasFieldError(fieldName: string): boolean {
    const form = this.currentStep() === 1 ? this.forgotPasswordForm : this.resetPasswordForm;
    const field = form.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  private getErrorMessages(fieldName: string): Record<string, string> {
    const errorMessages: Record<string, Record<string, string>> = {
      email: {
        required: "L'email est obligatoire",
        email: "Format d'email invalide"
      },
      code: {
        required: 'Le code est obligatoire',
        minlength: 'Le code doit contenir au moins 6 caractères'
      },
      newPassword: {
        required: 'Le nouveau mot de passe est obligatoire',
        minlength: 'Le mot de passe doit contenir au moins 8 caractères'
      },
      confirmPassword: {
        required: 'La confirmation du mot de passe est obligatoire',
        passwordMismatch: 'Les mots de passe ne correspondent pas'
      }
    };
    return errorMessages[fieldName] || {};
  }

  requestPasswordReset(): void {
    if (this.forgotPasswordForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const forgotPasswordData: ForgotPasswordRequest = {
        email: this.forgotPasswordForm.value.email
      };

      this.authService.forgotPasswordRequest(forgotPasswordData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.userEmail.set(this.forgotPasswordForm.value.email);
          this.successMessage.set(response.message || 'Code de réinitialisation envoyé à votre email !');
          this.currentStep.set(2);
        },
        error: (error) => {
          this.isLoading.set(false);
          const message = error?.error?.error || error?.error?.message || 'Erreur lors de l\'envoi du code';
          this.errorMessage.set(message);
        }
      });
    } else {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  confirmPasswordReset(): void {
    if (this.resetPasswordForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const resetPasswordData: ResetPasswordRequest = {
        email: this.userEmail(),
        code: this.resetPasswordForm.value.code,
        newPassword: this.resetPasswordForm.value.newPassword,
        confirmPassword: this.resetPasswordForm.value.confirmPassword
      };

      this.authService.forgotPasswordConfirm(resetPasswordData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set(response.message || 'Mot de passe réinitialisé avec succès ! Redirection...');
          setTimeout(() => {
            this.router.navigate(['/auth/login'], { replaceUrl: true });
          }, 2000);
        },
        error: (error) => {
          this.isLoading.set(false);
          const message = error?.error?.error || error?.error?.message || 'Erreur lors de la réinitialisation';
          this.errorMessage.set(message);
        }
      });
    } else {
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
    }
  }

  goBackToStep1(): void {
    this.currentStep.set(1);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.resetPasswordForm.reset();
  }
}
