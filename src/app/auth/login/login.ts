import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Authservice } from '../../services/authservice';
import { LoginRequest } from '../../shared/types/auth';

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
  
  loginForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: Authservice
  ) {
    this.loginForm = this.formBuilder.group({
      identifiant: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  getInputClasses(fieldName: string): string {
    const baseClasses = 'w-full px-4 py-3 pl-12 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200';
    const errorClasses = this.hasFieldError(fieldName) ? 'border-red-500' : 'border-gray-600';
    const passwordClasses = fieldName === 'motDePasse' ? 'pr-12' : '';
    return `${baseClasses} ${errorClasses} ${passwordClasses}`;
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    const errorMessages = this.getErrorMessages(fieldName);
    const errorKey = Object.keys(field.errors)[0];
    return errorMessages[errorKey] || '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  private getErrorMessages(fieldName: string): Record<string, string> {
    const errorMessages: Record<string, Record<string, string>> = {
      identifiant: {
        required: "L'email est obligatoire",
        email: "Format d'email invalide"
      },
      motDePasse: {
        required: 'Le mot de passe est obligatoire',
        minlength: 'Le mot de passe doit contenir au moins 3 caractères'
      }
    };
    return errorMessages[fieldName] || {};
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      const loginData: LoginRequest = {
        email: this.loginForm.value.identifiant,
        password: this.loginForm.value.motDePasse
      };
      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          // Stocker le token et les informations utilisateur
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('userInfo', JSON.stringify(response.userInfo));
          // Redirection vers la page d'accueil après connexion réussie
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Login error details:', error);
          console.error('Error status:', error.status);
          console.error('Error body:', error.error);
          const message = error?.error?.message || error?.message || 'Email ou mot de passe incorrect';
          this.errorMessage.set(message);
        }
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
}