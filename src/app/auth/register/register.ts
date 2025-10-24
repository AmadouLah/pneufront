import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { RegisterRequest } from '../../shared/types/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
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
    private authService: Authservice
  ) {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
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
    const passwordClasses = fieldName === 'password' || fieldName === 'confirmPassword' ? 'pr-12' : '';
    return `${baseClasses} ${errorClasses} ${passwordClasses}`;
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    const errorMessages = this.getErrorMessages(fieldName);
    const errorKey = Object.keys(field.errors)[0];
    return errorMessages[errorKey] || '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
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
      password: {
        required: 'Le mot de passe est obligatoire',
        minlength: 'Le mot de passe doit contenir au moins 8 caractères'
      },
      confirmPassword: {
        required: 'La confirmation du mot de passe est obligatoire',
        passwordMismatch: 'Les mots de passe ne correspondent pas'
      }
    };
    return errorMessages[fieldName] || {};
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
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
}
