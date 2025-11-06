import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environment';
import { FormHelperService } from '../../shared/services/form-helper.service';
import { formatCurrency } from '../../shared/utils/currency';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  brand: { id: number; name: string } | null;
  size: string | null;
  width: { id: number; value: number } | null;
  profile: { id: number; value: number } | null;
  diameter: { id: number; value: number } | null;
  season: 'ETE' | 'HIVER' | 'QUATRE_SAISONS' | 'TOUT_TERRAIN' | null;
  vehicleType: { id: number; name: string; category: { id: number; name: string } } | null;
  tireCondition: { id: number; name: string } | null;
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

interface Brand {
  id: number;
  name: string;
  active: boolean;
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
  
  // Brands
  brands = signal<Brand[]>([]);
  
  // Dimensions
  widths = signal<Array<{id: number; value: number}>>([]);
  profiles = signal<Array<{id: number; value: number}>>([]);
  diameters = signal<Array<{id: number; value: number}>>([]);
  
  // Vehicle Types
  vehicleTypes = signal<Array<{id: number; name: string; category: { id: number; name: string } }>>([]);
  filteredVehicleTypes = signal<Array<{id: number; name: string; category: { id: number; name: string } }>>([]);
  
  // Tire Conditions
  tireConditions = signal<Array<{id: number; name: string}>>([]);
  
  // Pagination
  currentPage = signal(0);
  pageSize = signal(10);
  totalElements = signal(0);
  totalPages = signal(0);

  // Filter values
  searchTerm = signal('');
  selectedBrand = signal<string>('');
  selectedSeason = signal<string>('');
  selectedVehicleType = signal<number | null>(null);
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
      brandId: [''],
      size: ['', Validators.maxLength(50)],
      widthId: [''],
      profileId: [''],
      diameterId: [''],
      season: [''],
      vehicleTypeId: [''],
      tireConditionId: [''],
      description: ['', Validators.maxLength(1000)],
      categoryId: ['', Validators.required],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
    this.loadDimensions();
    this.loadVehicleTypes();
    this.loadTireConditions();
    this.loadProducts();
    
    // Écouter les changements de catégorie pour filtrer les types de véhicules
    this.productForm.get('categoryId')?.valueChanges.subscribe((categoryId) => {
      this.onCategoryChange(categoryId);
    });
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
   * Charge les marques depuis l'API
   */
  loadBrands(): void {
    this.http.get<Brand[]>(`${environment.apiUrl}/brands/active`).subscribe({
      next: (brands) => this.brands.set(brands),
      error: () => this.brands.set([])
    });
  }

  /**
   * Charge les dimensions depuis l'API
   */
  loadDimensions(): void {
    this.http.get<Array<{id: number; value: number}>>(`${environment.apiUrl}/tire-dimensions/widths`).subscribe({
      next: (widths) => this.widths.set(widths),
      error: () => this.widths.set([])
    });
    
    this.http.get<Array<{id: number; value: number}>>(`${environment.apiUrl}/tire-dimensions/profiles`).subscribe({
      next: (profiles) => this.profiles.set(profiles),
      error: () => this.profiles.set([])
    });
    
    this.http.get<Array<{id: number; value: number}>>(`${environment.apiUrl}/tire-dimensions/diameters`).subscribe({
      next: (diameters) => this.diameters.set(diameters),
      error: () => this.diameters.set([])
    });
  }

  /**
   * Charge les types de véhicules depuis l'API
   */
  loadVehicleTypes(): void {
    this.http.get<Array<{id: number; name: string; category: { id: number; name: string } }>>(`${environment.apiUrl}/vehicle-types/active`).subscribe({
      next: (vehicleTypes) => {
        this.vehicleTypes.set(vehicleTypes);
        this.filterVehicleTypes();
      },
      error: () => this.vehicleTypes.set([])
    });
  }

  /**
   * Charge les états de pneus depuis l'API
   */
  loadTireConditions(): void {
    this.http.get<Array<{id: number; name: string}>>(`${environment.apiUrl}/tire-conditions/active`).subscribe({
      next: (conditions) => this.tireConditions.set(conditions),
      error: () => this.tireConditions.set([])
    });
  }

  /**
   * Gère le changement de catégorie
   */
  onCategoryChange(categoryId: string | number | null): void {
    if (!categoryId) {
      this.filteredVehicleTypes.set([]);
      this.productForm.patchValue({ vehicleTypeId: '' });
      return;
    }

    const categoryIdNum = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
    this.http.get<Array<{id: number; name: string; category: { id: number; name: string } }>>(`${environment.apiUrl}/vehicle-types/category/${categoryIdNum}`).subscribe({
      next: (vehicleTypes) => {
        this.filteredVehicleTypes.set(vehicleTypes);
        // Réinitialiser le type de véhicule si le type actuel n'est pas dans la nouvelle liste
        const currentVehicleTypeId = this.productForm.value.vehicleTypeId;
        if (currentVehicleTypeId && !vehicleTypes.find(vt => vt.id === currentVehicleTypeId)) {
          this.productForm.patchValue({ vehicleTypeId: '' });
        }
      },
      error: () => {
        this.filteredVehicleTypes.set([]);
        this.productForm.patchValue({ vehicleTypeId: '' });
      }
    });
  }

  /**
   * Filtre les types de véhicules selon la catégorie sélectionnée
   */
  private filterVehicleTypes(): void {
    const categoryId = this.productForm.value.categoryId;
    if (categoryId) {
      this.onCategoryChange(categoryId);
    } else {
      this.filteredVehicleTypes.set([]);
    }
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
    const vehicleTypeId = this.selectedVehicleType();
    if (vehicleTypeId !== null && vehicleTypeId !== undefined) {
      filtered = filtered.filter(p => p.vehicleType?.id === vehicleTypeId);
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
    const vehicleTypeValue = this.filterForm.value.vehicleType;
    this.selectedVehicleType.set(vehicleTypeValue ? (typeof vehicleTypeValue === 'string' ? parseInt(vehicleTypeValue, 10) : vehicleTypeValue) : null);
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
    this.selectedVehicleType.set(null);
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
      brandId: '',
      size: '',
      widthId: '',
      profileId: '',
      diameterId: '',
      season: '',
      vehicleTypeId: '',
      tireConditionId: '',
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
      brandId: product.brand?.id || '',
      size: product.size || '',
      widthId: product.width?.id || '',
      profileId: product.profile?.id || '',
      diameterId: product.diameter?.id || '',
      season: product.season || '',
      vehicleTypeId: product.vehicleType?.id || '',
      tireConditionId: product.tireCondition?.id || '',
      description: product.description || '',
      categoryId: product.category.id,
      active: product.active
    });
    // Charger les types de véhicules pour la catégorie du produit
    this.onCategoryChange(product.category.id);
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
    
    if (formValue.brandId) formData.append('brandId', formValue.brandId.toString());
    if (formValue.size) formData.append('size', formValue.size);
    if (formValue.widthId) formData.append('widthId', formValue.widthId.toString());
    if (formValue.profileId) formData.append('profileId', formValue.profileId.toString());
    if (formValue.diameterId) formData.append('diameterId', formValue.diameterId.toString());
    if (formValue.season) formData.append('season', formValue.season);
    if (formValue.vehicleTypeId) formData.append('vehicleTypeId', formValue.vehicleTypeId.toString());
    if (formValue.tireConditionId) formData.append('tireConditionId', formValue.tireConditionId.toString());
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
    return formatCurrency(price);
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
  getVehicleTypeLabel(vehicleType: { id: number; name: string } | null): string {
    return vehicleType?.name || '-';
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

