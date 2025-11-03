import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';

interface Category {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrls: ['./categories.css']
})
export class CategoriesComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  readonly formHelper = inject(FormHelperService);

  categories = signal<Category[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  showModal = signal(false);
  isEditMode = signal(false);
  editingCategoryId = signal<number | null>(null);
  categoryForm: FormGroup;

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Charge les catégories depuis l'API
   */
  loadCategories(): void {
    this.isLoading.set(true);
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des catégories:', error);
        this.categories.set([]);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Ouvre le modal pour créer une nouvelle catégorie
   */
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
    this.categoryForm.reset({
      name: '',
      description: '',
      active: true
    });
    this.showModal.set(true);
  }

  /**
   * Ouvre le modal pour modifier une catégorie
   */
  openEditModal(category: Category): void {
    this.isEditMode.set(true);
    this.editingCategoryId.set(category.id);
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      active: category.active
    });
    this.showModal.set(true);
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.isEditMode.set(false);
    this.editingCategoryId.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  /**
   * Soumet le formulaire de catégorie
   */
  submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.categoryForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.categoryForm.value;
    const payload = {
      name: formValue.name,
      description: formValue.description || null,
      active: formValue.active !== false
    };

    if (this.isEditMode()) {
      const id = this.editingCategoryId();
      if (id) {
        this.http.put(`${environment.apiUrl}/categories/${id}`, payload).subscribe({
          next: () => {
            this.successMessage.set('Catégorie mise à jour avec succès');
            this.loadCategories();
            setTimeout(() => this.closeModal(), 1500);
          },
          error: (error) => {
            this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la mise à jour'));
            this.isLoading.set(false);
          }
        });
      }
    } else {
      this.http.post(`${environment.apiUrl}/categories`, payload).subscribe({
        next: () => {
          this.successMessage.set('Catégorie créée avec succès');
          this.loadCategories();
          setTimeout(() => this.closeModal(), 1500);
        },
        error: (error) => {
          this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la création'));
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Active ou désactive une catégorie
   */
  toggleCategory(category: Category): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.put(`${environment.apiUrl}/categories/${category.id}/active?active=${!category.active}`, {}).subscribe({
      next: () => {
        this.successMessage.set(`Catégorie ${!category.active ? 'activée' : 'désactivée'} avec succès`);
        this.loadCategories();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la modification'));
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  /**
   * Supprime une catégorie
   */
  deleteCategory(category: Category): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.delete(`${environment.apiUrl}/categories/${category.id}`).subscribe({
      next: () => {
        this.successMessage.set('Catégorie supprimée avec succès');
        this.loadCategories();
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

