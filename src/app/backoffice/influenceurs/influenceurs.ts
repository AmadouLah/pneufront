import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';
import { Authservice } from '../../services/authservice';

interface Influenceur {
  id: number;
  commissionRate: number;
  archived: boolean;
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
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './influenceurs.html',
  styleUrls: ['./influenceurs.css']
})
export class InfluenceursComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(Authservice);
  readonly formHelper = inject(FormHelperService);

  influenceurs = signal<Influenceur[]>([]);
  filteredInfluenceurs = signal<Influenceur[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchTerm = signal('');
  actionLoadingId = signal<number | null>(null);
  actionType = signal<'toggle' | 'archive' | null>(null);
  isEditMode = signal(false);
  editingInfluenceurId = signal<number | null>(null);
  currentUserRole = signal<string | null>(null);

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

    const userInfo = this.authService.authUser();
    this.currentUserRole.set(userInfo?.role ?? null);
  }

  ngOnInit(): void {
    this.loadInfluenceurs();
  }

  loadInfluenceurs(): void {
    this.isLoading.set(true);
    this.http.get<Influenceur[]>(`${environment.apiUrl}/admin/influenceurs`).subscribe({
      next: (influenceurs) => {
        this.influenceurs.set(influenceurs);
        this.applySearchFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des influenceurs:', error);
        this.influenceurs.set([]);
        this.filteredInfluenceurs.set([]);
        this.isLoading.set(false);
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors du chargement'));
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  /**
   * Applique le filtre de recherche
   */
  private applySearchFilter(): void {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      this.filteredInfluenceurs.set(this.influenceurs());
      return;
    }
    const filtered = this.influenceurs().filter((influenceur) =>
      influenceur.user.firstName.toLowerCase().includes(term) ||
      influenceur.user.lastName.toLowerCase().includes(term) ||
      influenceur.user.email.toLowerCase().includes(term)
    );
    this.filteredInfluenceurs.set(filtered);
  }

  /**
   * Gère le changement de recherche
   */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applySearchFilter();
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingInfluenceurId.set(null);
    this.influenceurForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      commissionRate: '',
      active: true
    });
    this.influenceurForm.get('email')?.enable({ emitEvent: false });
    this.showModal.set(true);
  }

  openEditModal(influenceur: Influenceur): void {
    this.isEditMode.set(true);
    this.editingInfluenceurId.set(influenceur.id);
    this.influenceurForm.reset({
      firstName: influenceur.user.firstName,
      lastName: influenceur.user.lastName,
      email: influenceur.user.email,
      commissionRate: influenceur.commissionRate,
      active: influenceur.user.enabled
    });

    if (this.isDeveloper()) {
      this.influenceurForm.get('email')?.enable({ emitEvent: false });
    } else {
      this.influenceurForm.get('email')?.disable({ emitEvent: false });
    }

    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.isEditMode.set(false);
    this.editingInfluenceurId.set(null);
    this.influenceurForm.get('email')?.enable({ emitEvent: false });
  }

  submitInfluenceur(): void {
    if (this.influenceurForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.influenceurForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.influenceurForm.getRawValue();

    if (this.isEditMode()) {
      const influenceurId = this.editingInfluenceurId();
      if (!influenceurId) {
        this.errorMessage.set('Influenceur introuvable');
        this.isLoading.set(false);
        return;
      }

      const payload = this.buildUpdatePayload(formValue);
      this.http.put<{ message?: string }>(`${environment.apiUrl}/admin/influenceurs/${influenceurId}`, payload).subscribe({
        next: (response) => {
          this.successMessage.set(response.message || 'Influenceur mis à jour avec succès');
          this.loadInfluenceurs();
          setTimeout(() => {
            this.closeModal();
            this.successMessage.set('');
          }, 2000);
        },
        error: (error) => {
          this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la mise à jour'));
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
      return;
    }

    const payload = this.buildCreatePayload(formValue);
    this.http.post<{ message?: string }>(`${environment.apiUrl}/admin/influenceurs`, payload).subscribe({
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
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  toggleInfluenceurStatus(influenceur: Influenceur): void {
    const active = !influenceur.user.enabled;
    this.actionLoadingId.set(influenceur.id);
    this.actionType.set('toggle');
    this.errorMessage.set('');

    this.http.put<{ message?: string }>(
      `${environment.apiUrl}/admin/influenceurs/${influenceur.id}/status`,
      null,
      { params: { active: String(active) } }
    ).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || (active ? 'Influenceur activé avec succès' : 'Influenceur désactivé avec succès'));
        this.loadInfluenceurs();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la mise à jour du statut'));
        setTimeout(() => this.errorMessage.set(''), 5000);
        this.actionLoadingId.set(null);
        this.actionType.set(null);
      },
      complete: () => {
        this.actionLoadingId.set(null);
        this.actionType.set(null);
      }
    });
  }

  archiveInfluenceur(influenceur: Influenceur): void {
    if (!this.isDeveloper()) {
      return;
    }

    if (!confirm('Confirmez-vous l\'archivage de cet influenceur ? Son compte sera désactivé.')) {
      return;
    }

    this.actionLoadingId.set(influenceur.id);
    this.actionType.set('archive');
    this.errorMessage.set('');

    this.http.put<{ message?: string }>(`${environment.apiUrl}/admin/influenceurs/${influenceur.id}/archive`, null).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Influenceur archivé avec succès');
        this.loadInfluenceurs();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de l\'archivage'));
        setTimeout(() => this.errorMessage.set(''), 5000);
        this.actionLoadingId.set(null);
        this.actionType.set(null);
      },
      complete: () => {
        this.actionLoadingId.set(null);
        this.actionType.set(null);
      }
    });
  }

  private buildCreatePayload(formValue: any) {
    return {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim(),
      commissionRate: parseFloat(formValue.commissionRate),
      active: formValue.active !== false
    };
  }

  private buildUpdatePayload(formValue: any) {
    const payload: any = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      commissionRate: parseFloat(formValue.commissionRate)
    };

    if (this.isDeveloper()) {
      payload.email = formValue.email?.trim();
    }

    return payload;
  }

  isDeveloper(): boolean {
    return this.currentUserRole()?.toUpperCase() === 'DEVELOPER';
  }
}

