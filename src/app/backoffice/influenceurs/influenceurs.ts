import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';

interface Influenceur {
  id: number;
  commissionRate: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
  };
}

@Component({
  selector: 'app-influenceurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './influenceurs.html',
  styleUrls: ['./influenceurs.css']
})
export class InfluenceursComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  readonly formHelper = inject(FormHelperService);

  influenceurs = signal<Influenceur[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  showModal = signal(false);
  influenceurForm: FormGroup;

  constructor() {
    this.influenceurForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      commissionRate: ['', [Validators.required, Validators.min(0.01), Validators.max(100)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadInfluenceurs();
  }

  loadInfluenceurs(): void {
    this.isLoading.set(true);
    this.http.get<Influenceur[]>(`${environment.apiUrl}/admin/influenceurs`).subscribe({
      next: (influenceurs) => {
        this.influenceurs.set(influenceurs);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des influenceurs:', error);
        this.influenceurs.set([]);
        this.isLoading.set(false);
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors du chargement'));
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  openCreateModal(): void {
    this.influenceurForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      commissionRate: '',
      active: true
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  submitInfluenceur(): void {
    if (this.influenceurForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.influenceurForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.influenceurForm.value;
    const payload = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim(),
      commissionRate: parseFloat(formValue.commissionRate),
      active: formValue.active !== false
    };

    this.http.post<{ message: string; influenceur: Influenceur }>(`${environment.apiUrl}/admin/influenceurs`, payload).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Influenceur créé avec succès');
        this.loadInfluenceurs();
        setTimeout(() => {
          this.closeModal();
          this.successMessage.set('');
        }, 2000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la création'));
        this.isLoading.set(false);
      }
    });
  }
}

