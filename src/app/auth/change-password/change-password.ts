import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { FormHelperService } from '../../shared/services/form-helper.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './change-password.html',
  styleUrls: ['./change-password.css', '../shared/auth-theme.css']
})
export class ChangePasswordComponent {
  isLoading = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  readonly iconLock = 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';

  changePasswordForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private formHelper: FormHelperService
  ) {
    this.changePasswordForm = this.formBuilder.group({
      currentPassword: ['', FormHelperService.passwordValidator],
      newPassword: ['', FormHelperService.passwordValidator],
      confirmPassword: ['', FormHelperService.passwordValidator]
    }, { validators: FormHelperService.passwordMatchValidator('newPassword', 'confirmPassword') });
  }

  toggleCurrentPassword(): void {
    this.showCurrentPassword.set(!this.showCurrentPassword());
  }

  toggleNewPassword(): void {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  getInputClasses(fieldName: string): string {
    return this.formHelper.getInputClasses(fieldName, this.changePasswordForm);
  }

  getFieldError(fieldName: string): string {
    return this.formHelper.getFieldError(fieldName, this.changePasswordForm);
  }

  hasFieldError(fieldName: string): boolean {
    return this.formHelper.hasFieldError(fieldName, this.changePasswordForm);
  }

  onSubmit(): void {
    if (!this.changePasswordForm.valid) {
      this.formHelper.markAllFieldsAsTouched(this.changePasswordForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // En attendant l'implémentation backend, on simule une réponse rapide.
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set('Votre mot de passe a été mis à jour.');
      this.changePasswordForm.reset();
    }, 800);
  }
}
