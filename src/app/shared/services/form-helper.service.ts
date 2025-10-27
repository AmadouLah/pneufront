import { Injectable } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FormHelperService {
  /**
   * Retourne les classes CSS pour un champ de formulaire
   */
  getInputClasses(fieldName: string, form: FormGroup): string {
    const baseClasses = 'w-full px-4 py-3 pl-12 bg-gray-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200';
    const errorClasses = this.hasFieldError(fieldName, form) ? 'border-red-500' : 'border-gray-600';
    const passwordClasses = this.isPasswordField(fieldName) ? 'pr-12' : '';
    return `${baseClasses} ${errorClasses} ${passwordClasses}`;
  }

  /**
   * Retourne le message d'erreur pour un champ
   */
  getFieldError(fieldName: string, form: FormGroup): string {
    const field = form.get(fieldName);
    if (!field?.errors || !field.touched) return '';

    const errorMessages = this.getErrorMessages(fieldName);
    const errorKey = Object.keys(field.errors)[0];
    return errorMessages[errorKey] || '';
  }

  /**
   * Vérifie si un champ a une erreur
   */
  hasFieldError(fieldName: string, form: FormGroup): boolean {
    const field = form.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Marque tous les champs comme touchés
   */
  markAllFieldsAsTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => {
      form.get(key)?.markAsTouched();
    });
  }

  /**
   * Extrait le message d'erreur d'une réponse HTTP
   */
  extractErrorMessage(error: HttpErrorResponse, defaultMessage: string = 'Une erreur est survenue'): string {
    return error?.error?.error || error?.error?.message || error?.message || defaultMessage;
  }

  /**
   * Valide si un champ de formulaire est valide
   */
  isFieldValid(fieldName: string, form: FormGroup): boolean {
    const field = form.get(fieldName);
    return !!(field?.valid && field.touched);
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
        required: 'Le code de vérification est obligatoire',
        minlength: 'Le code doit contenir 6 chiffres',
        maxlength: 'Le code doit contenir 6 chiffres',
        pattern: 'Le code doit contenir exactement 6 chiffres'
      }
    };
    return errorMessages[fieldName] || {};
  }

  // Validators communs
  static emailValidator = [Validators.required, Validators.email];
  static passwordValidator = [Validators.required, Validators.minLength(8)];
  static codeValidator = [Validators.required, Validators.pattern(/^\d{6}$/)];
  
  /**
   * Validateur pour la correspondance des mots de passe
   */
  static passwordMatchValidator(passwordField: string = 'password', confirmPasswordField: string = 'confirmPassword') {
    return (form: FormGroup) => {
      const password = form.get(passwordField);
      const confirmPassword = form.get(confirmPasswordField);
      
      if (password && confirmPassword && password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      }
      
      if (confirmPassword?.hasError('passwordMismatch') && password?.value === confirmPassword?.value) {
        confirmPassword.setErrors(null);
      }
      
      return null;
    };
  }
}
