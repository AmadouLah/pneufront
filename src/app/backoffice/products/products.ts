import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  brand: string | null;
  size: string | null;
  season: 'ETE' | 'HIVER' | 'QUATRE_SAISONS' | 'TOUT_TERRAIN' | null;
  vehicleType: 'CITADINE' | 'BERLINE' | 'SUV' | 'PICKUP' | 'CAMION' | 'MOTO' | null;
  imageUrl: string | null;
  description: string | null;
  active: boolean;
  category: {
    id: number;
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
}

interface ProductPageResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class ProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private formHelper = inject(FormHelperService);

  // State
  products = signal<Product[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  
  // Filters
  showFilters = signal(false);
  filterForm: FormGroup;
  
  // Modal
  showModal = signal(false);
  isEditMode = signal(false);
  editingProductId = signal<number | null>(null);
  productForm: FormGroup;
  selectedImage = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  
  // Categories
  categories = signal<Category[]>([]);
  
  // Pagination
  currentPage = signal(0);
  pageSize = signal(10);
  totalElements = signal(0);
  totalPages = signal(0);

  // Filter values
  searchTerm = signal('');
  selectedBrand = signal<string>('');
  selectedSeason = signal<string>('');
  selectedVehicleType = signal<string>('');
  minStock = signal<number | null>(null);
  maxStock = signal<number | null>(null);
  
  // Sort
  sortBy = signal<string>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');
  
  // Selection
  selectedProducts = signal<Set<number>>(new Set());
  
  // Sort options
  readonly sortOptions = [
    { value: 'name', label: 'Nom' },
    { value: 'price', label: 'Prix' },
    { value: 'stock', label: 'Stock' },
    { value: 'category', label: 'Catégorie' }
  ];

  readonly seasonOptions = [
    { value: 'ETE', label: 'Été' },
    { value: 'HIVER', label: 'Hiver' },
    { value: 'QUATRE_SAISONS', label: '4 saisons' },
    { value: 'TOUT_TERRAIN', label: 'Tout-terrain' }
  ];

  readonly vehicleTypeOptions = [
    { value: 'CITADINE', label: 'Citadine' },
    { value: 'BERLINE', label: 'Berline' },
    { value: 'SUV', label: 'SUV/4x4' },
    { value: 'PICKUP', label: 'Pick-up' },
    { value: 'CAMION', label: 'Camion' },
    { value: 'MOTO', label: 'Moto' }
  ];

  constructor() {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      brand: [''],
      season: [''],
      vehicleType: [''],
      minStock: [null],
      maxStock: [null]
    });

    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      brand: ['', Validators.maxLength(50)],
      size: ['', Validators.maxLength(50)],
      season: [''],
      vehicleType: [''],
      description: ['', Validators.maxLength(1000)],
      categoryId: ['', Validators.required],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
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
   * Charge les produits avec filtres et pagination
   */
  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Si recherche textuelle, utiliser /search
    if (this.searchTerm().trim()) {
      const params = new HttpParams()
        .set('term', this.searchTerm().trim())
        .set('page', this.currentPage().toString())
        .set('size', this.pageSize().toString());

      this.http.get<ProductPageResponse>(`${environment.apiUrl}/products/search`, { params }).subscribe({
        next: (response) => {
          this.applyClientSideFilters(response);
        },
        error: (error) => {
          this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors du chargement des produits'));
          this.isLoading.set(false);
        }
      });
      return;
    }

    // Si filtres par marque/saison, utiliser /filter
    if (this.selectedBrand() || this.selectedSeason()) {
      let params = new HttpParams()
        .set('page', this.currentPage().toString())
        .set('size', this.pageSize().toString());

      if (this.selectedBrand()) {
        params = params.set('brand', this.selectedBrand());
      }
      if (this.selectedSeason()) {
        params = params.set('season', this.selectedSeason());
      }

      this.http.get<ProductPageResponse>(`${environment.apiUrl}/products/filter`, { params }).subscribe({
        next: (response) => {
          this.applyClientSideFilters(response);
        },
        error: (error) => {
          this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors du chargement des produits'));
          this.isLoading.set(false);
        }
      });
      return;
    }

    // Sinon, charger tous les produits (admin) et filtrer côté client
    const params = new HttpParams()
      .set('page', this.currentPage().toString())
      .set('size', this.pageSize().toString());

    this.http.get<ProductPageResponse>(`${environment.apiUrl}/products`, { params }).subscribe({
      next: (response) => {
        this.applyClientSideFilters(response);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors du chargement des produits'));
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Applique les filtres côté client (stock, type de véhicule)
   */
  private applyClientSideFilters(response: ProductPageResponse): void {
    let filtered = [...response.content];

    // Filtrer par type de véhicule
    if (this.selectedVehicleType()) {
      filtered = filtered.filter(p => p.vehicleType === this.selectedVehicleType());
    }

    // Filtrer par stock min
    if (this.minStock() !== null && this.minStock()! >= 0) {
      filtered = filtered.filter(p => p.stock >= this.minStock()!);
    }

    // Filtrer par stock max
    if (this.maxStock() !== null && this.maxStock()! >= 0) {
      filtered = filtered.filter(p => p.stock <= this.maxStock()!);
    }

    // Appliquer le tri
    this.products.set(filtered);
    this.applySort();

    // Pour la pagination, on garde les valeurs de la réponse serveur
    // mais on ajuste le total si on a des filtres côté client
    if (this.selectedVehicleType() || this.minStock() !== null || this.maxStock() !== null) {
      this.totalElements.set(filtered.length);
      this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));
    } else {
      this.totalElements.set(response.totalElements);
      this.totalPages.set(response.totalPages);
    }
    this.isLoading.set(false);
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    this.searchTerm.set(this.filterForm.value.searchTerm || '');
    this.selectedBrand.set(this.filterForm.value.brand || '');
    this.selectedSeason.set(this.filterForm.value.season || '');
    this.selectedVehicleType.set(this.filterForm.value.vehicleType || '');
    this.minStock.set(this.filterForm.value.minStock || null);
    this.maxStock.set(this.filterForm.value.maxStock || null);
    this.currentPage.set(0);
    this.loadProducts();
  }

  /**
   * Réinitialise les filtres
   */
  resetFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      brand: '',
      season: '',
      vehicleType: '',
      minStock: null,
      maxStock: null
    });
    this.searchTerm.set('');
    this.selectedBrand.set('');
    this.selectedSeason.set('');
    this.selectedVehicleType.set('');
    this.minStock.set(null);
    this.maxStock.set(null);
    this.currentPage.set(0);
    this.loadProducts();
  }

  /**
   * Ouvre le modal pour créer un nouveau produit
   */
  openCreateModal(): void {
    this.isEditMode.set(false);
    this.editingProductId.set(null);
    this.productForm.reset({
      name: '',
      price: '',
      stock: '',
      brand: '',
      size: '',
      season: '',
      vehicleType: '',
      description: '',
      categoryId: '',
      active: true
    });
    this.selectedImage.set(null);
    this.imagePreview.set(null);
    this.showModal.set(true);
  }

  /**
   * Ouvre le modal pour modifier un produit
   */
  openEditModal(product: Product): void {
    this.isEditMode.set(true);
    this.editingProductId.set(product.id);
    this.productForm.patchValue({
      name: product.name,
      price: product.price,
      stock: product.stock,
      brand: product.brand || '',
      size: product.size || '',
      season: product.season || '',
      vehicleType: product.vehicleType || '',
      description: product.description || '',
      categoryId: product.category.id,
      active: product.active
    });
    this.selectedImage.set(null);
    this.imagePreview.set(product.imageUrl || null);
    this.showModal.set(true);
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.showModal.set(false);
    this.isEditMode.set(false);
    this.editingProductId.set(null);
    this.selectedImage.set(null);
    this.imagePreview.set(null);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  /**
   * Soumet le formulaire de produit
   */
  submitProduct(): void {
    if (this.productForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.productForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.productForm.value;
    const formData = new FormData();
    
    formData.append('name', formValue.name);
    formData.append('price', formValue.price.toString());
    formData.append('stock', formValue.stock.toString());
    formData.append('categoryId', formValue.categoryId.toString());
    
    if (formValue.brand) formData.append('brand', formValue.brand);
    if (formValue.size) formData.append('size', formValue.size);
    if (formValue.season) formData.append('season', formValue.season);
    if (formValue.vehicleType) formData.append('vehicleType', formValue.vehicleType);
    if (formValue.description) formData.append('description', formValue.description);
    
    formData.append('active', (formValue.active !== false).toString());

    const imageFile = this.selectedImage();
    if (imageFile) {
      formData.append('image', imageFile);
    }

    if (this.isEditMode()) {
      const id = this.editingProductId();
      if (id) {
        this.http.put<Product>(`${environment.apiUrl}/products/${id}`, formData).subscribe({
          next: () => {
            this.successMessage.set('Produit mis à jour avec succès');
            this.loadProducts();
            setTimeout(() => this.closeModal(), 1500);
          },
          error: (error) => {
            this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la mise à jour'));
            this.isLoading.set(false);
          }
        });
      }
    } else {
      this.http.post<Product>(`${environment.apiUrl}/products`, formData).subscribe({
        next: () => {
          this.successMessage.set('Produit créé avec succès');
          this.loadProducts();
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
   * Gère la sélection d'une image
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      if (!file.type.startsWith('image/')) {
        this.errorMessage.set('Veuillez sélectionner un fichier image');
        input.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set('L\'image ne doit pas dépasser 5 MB');
        input.value = '';
        return;
      }

      this.selectedImage.set(file);
      this.errorMessage.set('');

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Supprime un produit
   */
  deleteProduct(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    this.isLoading.set(true);
    this.http.delete(`${environment.apiUrl}/products/${id}`).subscribe({
      next: () => {
        this.successMessage.set('Produit supprimé avec succès');
        this.loadProducts();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la suppression'));
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  /**
   * Change de page
   */
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  /**
   * Formate le prix
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  }

  /**
   * Retourne le libellé de la saison
   */
  getSeasonLabel(season: string | null): string {
    const option = this.seasonOptions.find(opt => opt.value === season);
    return option?.label || season || '-';
  }

  /**
   * Retourne le libellé du type de véhicule
   */
  getVehicleTypeLabel(type: string | null): string {
    const option = this.vehicleTypeOptions.find(opt => opt.value === type);
    return option?.label || type || '-';
  }

  /**
   * Retourne les classes pour le statut du stock
   */
  getStockClasses(stock: number): string {
    if (stock === 0) return 'text-red-500 font-bold';
    if (stock < 10) return 'text-yellow-500 font-semibold';
    return 'text-green-500';
  }

  /**
   * Change le tri
   */
  changeSort(sortField: string): void {
    if (this.sortBy() === sortField) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortField);
      this.sortDirection.set('asc');
    }
    this.applySort();
  }

  /**
   * Applique le tri
   */
  private applySort(): void {
    const sorted = [...this.products()];
    const direction = this.sortDirection() === 'asc' ? 1 : -1;
    
    sorted.sort((a, b) => {
      let aVal: any;
      let bVal: any;
      
      switch (this.sortBy()) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'stock':
          aVal = a.stock;
          bVal = b.stock;
          break;
        case 'category':
          aVal = a.category.name.toLowerCase();
          bVal = b.category.name.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
      return 0;
    });
    
    this.products.set(sorted);
  }

  /**
   * Toggle la sélection d'un produit
   */
  toggleProductSelection(id: number): void {
    const selected = new Set(this.selectedProducts());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedProducts.set(selected);
  }

  /**
   * Toggle la sélection de tous les produits
   */
  toggleAllSelection(): void {
    if (this.selectedProducts().size === this.products().length) {
      this.selectedProducts.set(new Set());
    } else {
      this.selectedProducts.set(new Set(this.products().map(p => p.id)));
    }
  }

  /**
   * Recherche en temps réel
   */
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage.set(0);
    this.loadProducts();
  }

  /**
   * Import (placeholder)
   */
  importProducts(): void {
    // TODO: Implémenter l'import
    alert('Fonctionnalité d\'import à venir');
  }
}

