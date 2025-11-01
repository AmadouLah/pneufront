import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { RegisterRequest } from '../../shared/types/auth';
import { FormHelperService } from '../../shared/services/form-helper.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css', '../shared/auth-theme.css']
})
export class RegisterComponent {

  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  registerForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: Authservice,
    private formHelper: FormHelperService
  ) {
    this.registerForm = this.formBuilder.group({
      email: ['', FormHelperService.emailValidator],
      password: ['', FormHelperService.passwordValidator],
      confirmPassword: ['', [Validators.required]]
    }, { validators: FormHelperService.passwordMatchValidator() });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  getInputClasses(fieldName: string): string {
    return this.formHelper.getInputClasses(fieldName, this.registerForm);
  }

  getFieldError(fieldName: string): string {
    return this.formHelper.getFieldError(fieldName, this.registerForm);
  }

  hasFieldError(fieldName: string): boolean {
    return this.formHelper.hasFieldError(fieldName, this.registerForm);
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.successMessage.set('');

      const registerData: RegisterRequest = {
        firstName: 'Utilisateur', // Valeur par défaut temporaire
        lastName: 'PneuMali',     // Valeur par défaut temporaire
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        confirmPassword: this.registerForm.value.confirmPassword,
        phoneNumber: null
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.successMessage.set('Inscription réussie ! Un code de vérification a été envoyé à votre email.');
          // Stocker l'email pour la vérification
          localStorage.setItem('pendingVerificationEmail', this.registerForm.value.email);
          // Rediriger vers la page de vérification
          setTimeout(() => {
            this.router.navigate(['/auth/verify'], { 
              queryParams: { email: this.registerForm.value.email },
              replaceUrl: true 
            });
          }, 2000);
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Register error details:', error);
          console.error('Error status:', error.status);
          console.error('Error body:', error.error);
          console.error('Error URL:', error.url);
          
          let message = 'Erreur lors de l\'inscription';
          
          if (error.status === 0) {
            message = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
          } else if (error.status === 400) {
            message = error?.error?.message || 'Données invalides';
          } else if (error.status === 409) {
            message = 'Un utilisateur avec cet email existe déjà';
          } else if (error.status >= 500) {
            message = 'Erreur serveur. Veuillez réessayer plus tard.';
          } else if (error?.error?.message) {
            message = error.error.message;
          } else if (error?.message) {
            message = error.message;
          }
          
          this.errorMessage.set(message);
        }
      });
    } else {
      this.formHelper.markAllFieldsAsTouched(this.registerForm);
    }
  }
}
