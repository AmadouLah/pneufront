import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { SetInitialPasswordRequest } from '../../shared/types/auth';
import { FormHelperService } from '../../shared/services/form-helper.service';

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './set-password.html',
  styleUrls: ['./set-password.css', '../shared/auth-theme.css']
})
export class SetPasswordComponent implements OnInit {
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  setPasswordForm: FormGroup;
  email = signal('');
  token = signal('');

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: Authservice,
    private formHelper: FormHelperService
  ) {
    this.setPasswordForm = this.formBuilder.group({
      password: ['', FormHelperService.passwordValidator],
      confirmPassword: ['', Validators.required]
    }, { validators: FormHelperService.passwordMatchValidator('password', 'confirmPassword') });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const emailParam = params['email'];
      const tokenParam = params['token'];
      
      if (!emailParam || !tokenParam) {
        this.errorMessage.set('Lien invalide. Veuillez utiliser le lien reçu par email.');
        return;
      }
      
      this.email.set(emailParam);
      this.token.set(tokenParam);
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  getInputClasses(fieldName: string): string {
    return this.formHelper.getInputClasses(fieldName, this.setPasswordForm);
  }

  getFieldError(fieldName: string): string {
    return this.formHelper.getFieldError(fieldName, this.setPasswordForm);
  }

  hasFieldError(fieldName: string): boolean {
    return this.formHelper.hasFieldError(fieldName, this.setPasswordForm);
  }

  submitSetPassword(): void {
    if (this.setPasswordForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.setPasswordForm);
      return;
    }

    if (!this.email() || !this.token()) {
      this.errorMessage.set('Lien invalide. Veuillez utiliser le lien reçu par email.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const setPasswordData: SetInitialPasswordRequest = {
      email: this.email(),
      token: this.token(),
      password: this.setPasswordForm.value.password,
      confirmPassword: this.setPasswordForm.value.confirmPassword
    };

    this.authService.setInitialPassword(setPasswordData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/auth/login'], { 
          queryParams: { email: this.email() },
          replaceUrl: true 
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        const message = this.formHelper.extractErrorMessage(error, 'Erreur lors de la définition du mot de passe');
        this.errorMessage.set(message);
      }
    });
  }
}

