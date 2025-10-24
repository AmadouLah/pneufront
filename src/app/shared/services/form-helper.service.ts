import { Injectable } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormHelperService {

  getInputClasses(fieldName: string, form: FormGroup): string {
    const baseClasses = 'w-full px-4 py-3 pl-12 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200';
    const errorClasses = this.hasFieldError(fieldName, form) ? 'border-red-500' : 'border-gray-600';
    const passwordClasses = this.isPasswordField(fieldName) ? 'pr-12' : '';
    return `${baseClasses} ${errorClasses} ${passwordClasses}`;
  }

  getFieldError(fieldName: string, form: FormGroup): string {
    const field = form.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    const errorMessages = this.getErrorMessages(fieldName);
    const errorKey = Object.keys(field.errors)[0];
    return errorMessages[errorKey] || '';
  }

  hasFieldError(fieldName: string, form: FormGroup): boolean {
    const field = form.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  private isPasswordField(fieldName: string): boolean {
    return ['password', 'confirmPassword', 'newPassword', 'motDePasse'].includes(fieldName);
  }

  private getErrorMessages(fieldName: string): Record<string, string> {
    const errorMessages: Record<string, Record<string, string>> = {
      email: {
        required: "L'email est obligatoire",
        email: "Format d'email invalide"
      },
      identifiant: {
        required: "L'email est obligatoire",
        email: "Format d'email invalide"
      },
      password: {
        required: 'Le mot de passe est obligatoire',
        minlength: 'Le mot de passe doit contenir au moins 8 caractères'
      },
      motDePasse: {
        required: 'Le mot de passe est obligatoire',
        minlength: 'Le mot de passe doit contenir au moins 3 caractères'
      },
      newPassword: {
        required: 'Le nouveau mot de passe est obligatoire',
        minlength: 'Le mot de passe doit contenir au moins 8 caractères'
      },
      confirmPassword: {
        required: 'La confirmation du mot de passe est obligatoire',
        passwordMismatch: 'Les mots de passe ne correspondent pas'
      },
      code: {
        required: 'Le code est obligatoire',
        minlength: 'Le code doit contenir au moins 6 caractères'
      }
    };
    return errorMessages[fieldName] || {};
  }

  // Validators communs
  static emailValidator = [Validators.required, Validators.email];
  static passwordValidator = [Validators.required, Validators.minLength(8)];
  static codeValidator = [Validators.required, Validators.minLength(6)];
}
