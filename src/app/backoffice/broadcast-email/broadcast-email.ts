import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';

@Component({
  selector: 'app-broadcast-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './broadcast-email.html',
  styleUrls: ['./broadcast-email.css']
})
export class BroadcastEmailComponent {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly form: FormGroup;
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.form = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10000)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const payload = {
      subject: this.form.value.subject,
      message: this.form.value.message
    };

    this.http.post(`${environment.apiUrl}/admin/broadcast-email`, payload).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.successMessage.set(response.message || 'Email envoyé avec succès à tous les utilisateurs');
        this.form.reset();
      },
      error: (error) => {
        this.isLoading.set(false);
        const errorMsg = error.error?.error || error.error?.message || 'Erreur lors de l\'envoi de l\'email';
        this.errorMessage.set(errorMsg);
      }
    });
  }

  get subject() {
    return this.form.get('subject');
  }

  get message() {
    return this.form.get('message');
  }
}
