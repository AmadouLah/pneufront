import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';

interface Promotion {
  id: number;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountPercentage: number | null;
  discountAmount: number | null;
  startDate: string;
  endDate: string;
  influenceur: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

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
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './promotions.html',
  styleUrls: ['./promotions.css']
})
export class PromotionsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  readonly formHelper = inject(FormHelperService);

  promotions = signal<Promotion[]>([]);
  filteredPromotions = signal<Promotion[]>([]);
  influenceurs = signal<Influenceur[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  searchTerm = signal('');
  
  showModal = signal(false);
  isEditMode = signal(false);
  editingPromotionId = signal<number | null>(null);
  promotionForm: FormGroup;

  readonly promotionTypes = [
    { value: 'PERCENTAGE', label: 'Pourcentage' },
    { value: 'FIXED_AMOUNT', label: 'Montant fixe' }
  ];

  constructor() {
    this.promotionForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['PERCENTAGE', Validators.required],
      discountPercentage: [null],
      discountAmount: [null],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      influenceurId: ['', Validators.required]
    });

    // Validation conditionnelle selon le type
    this.promotionForm.get('type')?.valueChanges.subscribe(type => {
      if (type === 'PERCENTAGE') {
        this.promotionForm.get('discountPercentage')?.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
        this.promotionForm.get('discountAmount')?.clearValidators();
        this.promotionForm.get('discountAmount')?.setValue(null);
      } else if (type === 'FIXED_AMOUNT') {
        this.promotionForm.get('discountAmount')?.setValidators([Validators.required, Validators.min(0.01)]);
        this.promotionForm.get('discountPercentage')?.clearValidators();
        this.promotionForm.get('discountPercentage')?.setValue(null);
      }
      this.promotionForm.get('discountPercentage')?.updateValueAndValidity();
      this.promotionForm.get('discountAmount')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.loadInfluenceurs();
    this.loadPromotions();
  }

  loadInfluenceurs(): void {
    this.http.get<Influenceur[]>(`${environment.apiUrl}/admin/influenceurs`).subscribe({
      next: (influenceurs) => this.influenceurs.set(influenceurs),
      error: () => this.influenceurs.set([])
    });
  }

  loadPromotions(): void {
    this.isLoading.set(true);
    this.http.get<Promotion[]>(`${environment.apiUrl}/promotions/admin`).subscribe({
      next: (promotions) => {
        this.promotions.set(promotions);
        this.applySearchFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des promotions:', error);
        this.promotions.set([]);
        this.filteredPromotions.set([]);
        this.isLoading.set(false);
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors du chargement'));
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  private applySearchFilter(): void {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      this.filteredPromotions.set(this.promotions());
      return;
    }
    const filtered = this.promotions().filter(promotion =>
      promotion.code.toLowerCase().includes(term) ||
      (promotion.influenceur && (
        promotion.influenceur.firstName.toLowerCase().includes(term) ||
        promotion.influenceur.lastName.toLowerCase().includes(term) ||
        promotion.influenceur.email.toLowerCase().includes(term)
      ))
    );
    this.filteredPromotions.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applySearchFilter();
  }

  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingPromotionId.set(null);
    this.promotionForm.reset({
      code: '',
      type: 'PERCENTAGE',
      discountPercentage: null,
      discountAmount: null,
      startDate: '',
      endDate: '',
      influenceurId: ''
    });
    this.showModal.set(true);
  }

  openEditModal(promotion: Promotion): void {
    this.isEditMode.set(true);
    this.editingPromotionId.set(promotion.id);
    this.promotionForm.patchValue({
      code: promotion.code,
      type: promotion.type,
      discountPercentage: promotion.discountPercentage,
      discountAmount: promotion.discountAmount,
      startDate: promotion.startDate,
      endDate: promotion.endDate,
      influenceurId: promotion.influenceur?.id || ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.isEditMode.set(false);
    this.editingPromotionId.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  submitPromotion(): void {
    if (this.promotionForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.promotionForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.promotionForm.value;
    const payload = {
      code: formValue.code.trim(),
      type: formValue.type,
      discountPercentage: formValue.type === 'PERCENTAGE' ? formValue.discountPercentage : null,
      discountAmount: formValue.type === 'FIXED_AMOUNT' ? formValue.discountAmount : null,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      influenceurId: formValue.influenceurId
    };

    if (this.isEditMode()) {
      const id = this.editingPromotionId();
      if (id) {
        this.http.put<{ message: string; promotion: Promotion }>(`${environment.apiUrl}/promotions/admin/${id}`, payload).subscribe({
          next: (response) => {
            this.successMessage.set(response.message || 'Promotion mise à jour avec succès');
            this.loadPromotions();
            setTimeout(() => {
              this.closeModal();
              this.successMessage.set('');
            }, 1500);
          },
          error: (error) => {
            this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la mise à jour'));
            this.isLoading.set(false);
          }
        });
      }
    } else {
      this.http.post<{ message: string; promotion: Promotion }>(`${environment.apiUrl}/promotions`, payload).subscribe({
        next: (response) => {
          this.successMessage.set(response.message || 'Promotion créée avec succès');
          this.loadPromotions();
          setTimeout(() => {
            this.closeModal();
            this.successMessage.set('');
          }, 1500);
        },
        error: (error) => {
          this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la création'));
          this.isLoading.set(false);
        }
      });
    }
  }

  deletePromotion(promotion: Promotion): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la promotion "${promotion.code}" ?`)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.http.delete(`${environment.apiUrl}/promotions/admin/${promotion.id}`).subscribe({
      next: () => {
        this.successMessage.set('Promotion supprimée avec succès');
        this.loadPromotions();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la suppression'));
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  getDiscountDisplay(promotion: Promotion): string {
    if (promotion.type === 'PERCENTAGE' && promotion.discountPercentage) {
      return `${promotion.discountPercentage}%`;
    } else if (promotion.type === 'FIXED_AMOUNT' && promotion.discountAmount) {
      return `${promotion.discountAmount} XOF`;
    }
    return '-';
  }

  getStatus(promotion: Promotion): { label: string; class: string } {
    const today = new Date().toISOString().split('T')[0];
    if (promotion.startDate > today) {
      return { label: 'À venir', class: 'bg-blue-900/50 text-blue-400 border border-blue-500' };
    } else if (promotion.endDate < today) {
      return { label: 'Expirée', class: 'bg-red-900/50 text-red-400 border border-red-500' };
    }
    return { label: 'Active', class: 'bg-green-900/50 text-green-400 border border-green-500' };
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

