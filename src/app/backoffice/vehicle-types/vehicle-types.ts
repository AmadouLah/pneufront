import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';

interface VehicleType {
  id: number;
  name: string;
  description: string | null;
  category: { id: number; name: string };
  active: boolean;
}

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-vehicle-types',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './vehicle-types.html',
  styleUrls: ['./vehicle-types.css']
})
export class VehicleTypesComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  readonly formHelper = inject(FormHelperService);

  vehicleTypes = signal<VehicleType[]>([]);
  filteredVehicleTypes = signal<VehicleType[]>([]);
  categories = signal<Category[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchTerm = signal('');
  
  showModal = signal(false);
  isEditMode = signal(false);
  editingVehicleTypeId = signal<number | null>(null);
  vehicleTypeForm: FormGroup;

  constructor() {
    this.vehicleTypeForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      categoryId: ['', Validators.required],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadVehicleTypes();
  }

  /**
   * Charge les catégories depuis l'API
   */
  loadCategories(): void {
    this.http.get<Category[]>(`${environment.apiUrl}/categories/active`).subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([])
    });
  }

  /**
   * Charge les types de véhicules depuis l'API
   */
  loadVehicleTypes(): void {
    this.isLoading.set(true);
    this.http.get<VehicleType[]>(`${environment.apiUrl}/vehicle-types`).subscribe({
      next: (vehicleTypes) => {
        this.vehicleTypes.set(vehicleTypes);
        this.applySearchFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des types de véhicules:', error);
        this.vehicleTypes.set([]);
        this.filteredVehicleTypes.set([]);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Applique le filtre de recherche
   */
  private applySearchFilter(): void {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      this.filteredVehicleTypes.set(this.vehicleTypes());
      return;
    }
    const filtered = this.vehicleTypes().filter(vehicleType =>
      vehicleType.name.toLowerCase().includes(term) ||
      vehicleType.category.name.toLowerCase().includes(term) ||
      (vehicleType.description && vehicleType.description.toLowerCase().includes(term))
    );
    this.filteredVehicleTypes.set(filtered);
  }

  /**
   * Gère le changement de recherche
   */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applySearchFilter();
  }

  /**
   * Ouvre le modal pour créer un nouveau type de véhicule
   */
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingVehicleTypeId.set(null);
    this.vehicleTypeForm.reset({
      name: '',
      description: '',
      categoryId: '',
      active: true
    });
    this.showModal.set(true);
  }

  /**
   * Ouvre le modal pour modifier un type de véhicule
   */
  openEditModal(vehicleType: VehicleType): void {
    this.isEditMode.set(true);
    this.editingVehicleTypeId.set(vehicleType.id);
    this.vehicleTypeForm.patchValue({
      name: vehicleType.name,
      description: vehicleType.description || '',
      categoryId: vehicleType.category.id,
      active: vehicleType.active
    });
    this.showModal.set(true);
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.isEditMode.set(false);
    this.editingVehicleTypeId.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  /**
   * Soumet le formulaire de type de véhicule
   */
  submitVehicleType(): void {
    if (this.vehicleTypeForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.vehicleTypeForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.vehicleTypeForm.value;
    const payload = {
      name: formValue.name,
      description: formValue.description || null,
      category: { id: formValue.categoryId },
      active: formValue.active !== false
    };

    if (this.isEditMode()) {
      const id = this.editingVehicleTypeId();
      if (id) {
        this.http.put(`${environment.apiUrl}/vehicle-types/${id}`, payload).subscribe({
          next: () => {
            this.successMessage.set('Type de véhicule mis à jour avec succès');
            this.loadVehicleTypes();
            setTimeout(() => this.closeModal(), 1500);
          },
          error: (error) => {
            this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la mise à jour'));
            this.isLoading.set(false);
          }
        });
      }
    } else {
      this.http.post(`${environment.apiUrl}/vehicle-types`, payload).subscribe({
        next: () => {
          this.successMessage.set('Type de véhicule créé avec succès');
          this.loadVehicleTypes();
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
   * Active ou désactive un type de véhicule
   */
  toggleVehicleType(vehicleType: VehicleType): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.put(`${environment.apiUrl}/vehicle-types/${vehicleType.id}/active?active=${!vehicleType.active}`, {}).subscribe({
      next: () => {
        this.successMessage.set(`Type de véhicule ${!vehicleType.active ? 'activé' : 'désactivé'} avec succès`);
        this.loadVehicleTypes();
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
   * Supprime un type de véhicule
   */
  deleteVehicleType(vehicleType: VehicleType): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le type de véhicule "${vehicleType.name}" ?`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.delete(`${environment.apiUrl}/vehicle-types/${vehicleType.id}`).subscribe({
      next: () => {
        this.successMessage.set('Type de véhicule supprimé avec succès');
        this.loadVehicleTypes();
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

