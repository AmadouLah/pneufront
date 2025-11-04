import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';

interface TireCondition {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

@Component({
  selector: 'app-tire-conditions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tire-conditions.html',
  styleUrls: ['./tire-conditions.css']
})
export class TireConditionsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  readonly formHelper = inject(FormHelperService);

  tireConditions = signal<TireCondition[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  showModal = signal(false);
  isEditMode = signal(false);
  editingTireConditionId = signal<number | null>(null);
  tireConditionForm: FormGroup;

  constructor() {
    this.tireConditionForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadTireConditions();
  }

  loadTireConditions(): void {
    this.isLoading.set(true);
    this.http.get<TireCondition[]>(`${environment.apiUrl}/tire-conditions`).subscribe({
      next: (conditions) => {
        this.tireConditions.set(conditions);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des états de pneus:', error);
        this.tireConditions.set([]);
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingTireConditionId.set(null);
    this.tireConditionForm.reset({
      name: '',
      description: '',
      active: true
    });
    this.showModal.set(true);
  }

  openEditModal(condition: TireCondition): void {
    this.isEditMode.set(true);
    this.editingTireConditionId.set(condition.id);
    this.tireConditionForm.patchValue({
      name: condition.name,
      description: condition.description || '',
      active: condition.active
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.isEditMode.set(false);
    this.editingTireConditionId.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  submitTireCondition(): void {
    if (this.tireConditionForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.tireConditionForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.tireConditionForm.value;
    const payload = {
      name: formValue.name,
      description: formValue.description || null,
      active: formValue.active !== false
    };

    if (this.isEditMode()) {
      const id = this.editingTireConditionId();
      if (id) {
        this.http.put(`${environment.apiUrl}/tire-conditions/${id}`, payload).subscribe({
          next: () => {
            this.successMessage.set('État de pneu mis à jour avec succès');
            this.loadTireConditions();
            setTimeout(() => this.closeModal(), 1500);
          },
          error: (error) => {
            this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la mise à jour'));
            this.isLoading.set(false);
          }
        });
      }
    } else {
      this.http.post(`${environment.apiUrl}/tire-conditions`, payload).subscribe({
        next: () => {
          this.successMessage.set('État de pneu créé avec succès');
          this.loadTireConditions();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (error) => {
          this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la création'));
          this.isLoading.set(false);
        }
      });
    }
  }

  toggleTireCondition(condition: TireCondition): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.put(`${environment.apiUrl}/tire-conditions/${condition.id}/active?active=${!condition.active}`, {}).subscribe({
      next: () => {
        this.successMessage.set(`État de pneu ${!condition.active ? 'activé' : 'désactivé'} avec succès`);
        this.loadTireConditions();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la modification'));
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  deleteTireCondition(condition: TireCondition): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'état de pneu "${condition.name}" ?`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.delete(`${environment.apiUrl}/tire-conditions/${condition.id}`).subscribe({
      next: () => {
        this.successMessage.set('État de pneu supprimé avec succès');
        this.loadTireConditions();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la suppression'));
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }
}

