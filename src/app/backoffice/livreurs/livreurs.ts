import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';
import { Authservice } from '../../services/authservice';

interface Livreur {
  id: number;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
  };
}

@Component({
  selector: 'app-livreurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './livreurs.html',
  styleUrls: ['./livreurs.css']
})
export class LivreursComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(Authservice);
  readonly formHelper = inject(FormHelperService);

  livreurs = signal<Livreur[]>([]);
  filteredLivreurs = signal<Livreur[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchTerm = signal('');
  actionLoadingId = signal<number | null>(null);
  actionType = signal<'toggle' | null>(null);
  isEditMode = signal(false);
  editingLivreurId = signal<number | null>(null);
  currentUserRole = signal<string | null>(null);

  showModal = signal(false);
  livreurForm: FormGroup;

  constructor() {
    this.livreurForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      active: [true]
    });

    const userInfo = this.authService.authUser();
    this.currentUserRole.set(userInfo?.role ?? null);
  }

  ngOnInit(): void {
    this.loadLivreurs();
  }

  loadLivreurs(): void {
    this.isLoading.set(true);
    this.http.get<Livreur[]>(`${environment.apiUrl}/admin/livreurs`).subscribe({
      next: (livreurs) => {
        this.livreurs.set(livreurs);
        this.applySearchFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des livreurs:', error);
        this.livreurs.set([]);
        this.filteredLivreurs.set([]);
        this.isLoading.set(false);
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors du chargement'));
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  private applySearchFilter(): void {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      this.filteredLivreurs.set(this.livreurs());
      return;
    }
    const filtered = this.livreurs().filter((livreur) =>
      livreur.user.firstName.toLowerCase().includes(term) ||
      livreur.user.lastName.toLowerCase().includes(term) ||
      livreur.user.email.toLowerCase().includes(term)
    );
    this.filteredLivreurs.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applySearchFilter();
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingLivreurId.set(null);
    this.livreurForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      active: true
    });
    this.livreurForm.get('email')?.enable({ emitEvent: false });
    this.showModal.set(true);
  }

  openEditModal(livreur: Livreur): void {
    this.isEditMode.set(true);
    this.editingLivreurId.set(livreur.id);
    this.livreurForm.reset({
      firstName: livreur.user.firstName,
      lastName: livreur.user.lastName,
      email: livreur.user.email,
      active: livreur.user.enabled
    });

    if (this.isDeveloper()) {
      this.livreurForm.get('email')?.enable({ emitEvent: false });
    } else {
      this.livreurForm.get('email')?.disable({ emitEvent: false });
    }

    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.isEditMode.set(false);
    this.editingLivreurId.set(null);
    this.livreurForm.get('email')?.enable({ emitEvent: false });
  }

  submitLivreur(): void {
    if (this.livreurForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.livreurForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.livreurForm.getRawValue();

    if (this.isEditMode()) {
      const livreurId = this.editingLivreurId();
      if (!livreurId) {
        this.errorMessage.set('Livreur introuvable');
        this.isLoading.set(false);
        return;
      }

      const payload = this.buildUpdatePayload(formValue);
      this.http.put<{ message?: string }>(`${environment.apiUrl}/admin/livreurs/${livreurId}`, payload).subscribe({
        next: (response) => {
          this.successMessage.set(response.message || 'Livreur mis à jour avec succès');
          this.loadLivreurs();
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
    this.http.post<{ message?: string }>(`${environment.apiUrl}/admin/livreurs`, payload).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Livreur créé avec succès');
        this.loadLivreurs();
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

  toggleLivreurStatus(livreur: Livreur): void {
    const active = !livreur.user.enabled;
    this.actionLoadingId.set(livreur.id);
    this.actionType.set('toggle');
    this.errorMessage.set('');

    this.http.put<{ message?: string }>(
      `${environment.apiUrl}/admin/livreurs/${livreur.id}/status`,
      null,
      { params: { active: String(active) } }
    ).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || (active ? 'Livreur activé avec succès' : 'Livreur désactivé avec succès'));
        this.loadLivreurs();
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

  deleteLivreur(livreur: Livreur): void {
    if (!this.isDeveloper()) {
      return;
    }

    if (!confirm('Confirmez-vous la suppression de ce livreur ? Cette action est irréversible.')) {
      return;
    }

    this.actionLoadingId.set(livreur.id);
    this.errorMessage.set('');

    this.http.delete<{ message?: string }>(`${environment.apiUrl}/admin/livreurs/${livreur.id}`).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Livreur supprimé avec succès');
        this.loadLivreurs();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la suppression'));
        setTimeout(() => this.errorMessage.set(''), 5000);
        this.actionLoadingId.set(null);
      },
      complete: () => {
        this.actionLoadingId.set(null);
      }
    });
  }

  private buildCreatePayload(formValue: any) {
    return {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim(),
      active: formValue.active !== false
    };
  }

  private buildUpdatePayload(formValue: any) {
    const payload: any = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim()
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
