import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { ForgotPasswordRequest, ResetPasswordRequest } from '../../shared/types/auth';
import { FormHelperService } from '../../shared/services/form-helper.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css', '../shared/auth-theme.css']
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
    private authService: Authservice,
    private formHelper: FormHelperService
  ) {
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', FormHelperService.emailValidator]
    });

    this.resetPasswordForm = this.formBuilder.group({
      code: ['', FormHelperService.codeValidator],
      newPassword: ['', FormHelperService.passwordValidator],
      confirmPassword: ['', Validators.required]
    }, { validators: FormHelperService.passwordMatchValidator('newPassword', 'confirmPassword') });
  }

  private activeForm(): FormGroup {
    return this.currentStep() === 1 ? this.forgotPasswordForm : this.resetPasswordForm;
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  getInputClasses(fieldName: string): string {
    return this.formHelper.getInputClasses(fieldName, this.activeForm());
  }

  getFieldError(fieldName: string): string {
    return this.formHelper.getFieldError(fieldName, this.activeForm());
  }

  hasFieldError(fieldName: string): boolean {
    return this.formHelper.hasFieldError(fieldName, this.activeForm());
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
          const message = this.formHelper.extractErrorMessage(error, 'Erreur lors de l\'envoi du code');
          this.errorMessage.set(message);
        }
      });
    } else {
      this.formHelper.markAllFieldsAsTouched(this.forgotPasswordForm);
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
          const message = this.formHelper.extractErrorMessage(error, 'Erreur lors de la réinitialisation');
          this.errorMessage.set(message);
        }
      });
    } else {
      this.formHelper.markAllFieldsAsTouched(this.resetPasswordForm);
    }
  }

  goBackToStep1(): void {
    this.currentStep.set(1);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.resetPasswordForm.reset();
  }
}
