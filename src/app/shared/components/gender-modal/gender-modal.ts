import { CommonModule } from '@angular/common';
import { Component, signal, EventEmitter, Output } from '@angular/core';
import { Authservice } from '../../../services/authservice';
import { UpdateGenderRequest } from '../../../shared/types/auth';

@Component({
  selector: 'app-gender-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gender-modal.html',
  styleUrls: ['./gender-modal.css', '../../../auth/shared/auth-theme.css']
})
export class GenderModalComponent {
  @Output() closed = new EventEmitter<void>();

  selectedGender = signal<'HOMME' | 'FEMME' | 'AUTRE' | null>(null);
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor(private readonly authService: Authservice) {}

  selectGender(gender: 'HOMME' | 'FEMME' | 'AUTRE'): void {
    this.selectedGender.set(gender);
  }

  onSubmit(): void {
    const gender = this.selectedGender();
    if (!gender) {
      this.errorMessage.set('Veuillez sélectionner une option');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const payload: UpdateGenderRequest = { gender };

    this.authService.updateGender(payload).subscribe({
      next: () => {
        const userInfo = this.authService.authUser();
        if (userInfo) {
          userInfo.gender = gender;
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
        this.closed.emit();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error?.error?.error || 'Erreur lors de l\'enregistrement');
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}
