import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';

interface Brand {
  id: number;
  name: string;
  active: boolean;
}

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './brands.html',
  styleUrls: ['./brands.css']
})
export class BrandsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  readonly formHelper = inject(FormHelperService);

  brands = signal<Brand[]>([]);
  filteredBrands = signal<Brand[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchTerm = signal('');
  
  showModal = signal(false);
  isEditMode = signal(false);
  editingBrandId = signal<number | null>(null);
  brandForm: FormGroup;

  constructor() {
    this.brandForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  /**
   * Charge les marques depuis l'API
   */
  loadBrands(): void {
    this.isLoading.set(true);
    this.http.get<Brand[]>(`${environment.apiUrl}/brands`).subscribe({
      next: (brands) => {
        this.brands.set(brands);
        this.applySearchFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des marques:', error);
        this.brands.set([]);
        this.filteredBrands.set([]);
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
      this.filteredBrands.set(this.brands());
      return;
    }
    const filtered = this.brands().filter(brand =>
      brand.name.toLowerCase().includes(term)
    );
    this.filteredBrands.set(filtered);
  }

  /**
   * Gère le changement de recherche
   */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applySearchFilter();
  }

  /**
   * Ouvre le modal pour créer une nouvelle marque
   */
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingBrandId.set(null);
    this.brandForm.reset({
      name: '',
      active: true
    });
    this.showModal.set(true);
  }

  /**
   * Ouvre le modal pour modifier une marque
   */
  openEditModal(brand: Brand): void {
    this.isEditMode.set(true);
    this.editingBrandId.set(brand.id);
    this.brandForm.patchValue({
      name: brand.name,
      active: brand.active
    });
    this.showModal.set(true);
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.isEditMode.set(false);
    this.editingBrandId.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  /**
   * Soumet le formulaire de marque
   */
  submitBrand(): void {
    if (this.brandForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.brandForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.brandForm.value;
    const payload = {
      name: formValue.name,
      active: formValue.active !== false
    };

    if (this.isEditMode()) {
      const id = this.editingBrandId();
      if (id) {
        this.http.put(`${environment.apiUrl}/brands/${id}`, payload).subscribe({
          next: () => {
            this.successMessage.set('Marque mise à jour avec succès');
            this.loadBrands();
            setTimeout(() => this.closeModal(), 1500);
          },
          error: (error) => {
            this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la mise à jour'));
            this.isLoading.set(false);
          }
        });
      }
    } else {
      this.http.post(`${environment.apiUrl}/brands`, payload).subscribe({
        next: () => {
          this.successMessage.set('Marque créée avec succès');
          this.loadBrands();
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
   * Active ou désactive une marque
   */
  toggleBrand(brand: Brand): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.put(`${environment.apiUrl}/brands/${brand.id}/active?active=${!brand.active}`, {}).subscribe({
      next: () => {
        this.successMessage.set(`Marque ${!brand.active ? 'activée' : 'désactivée'} avec succès`);
        this.loadBrands();
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
   * Supprime une marque
   */
  deleteBrand(brand: Brand): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la marque "${brand.name}" ?`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.delete(`${environment.apiUrl}/brands/${brand.id}`).subscribe({
      next: () => {
        this.successMessage.set('Marque supprimée avec succès');
        this.loadBrands();
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

