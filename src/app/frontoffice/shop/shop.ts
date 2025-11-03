import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, HttpParams } from '@angular/common/http';

import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { PRICE_RANGES, SORT_OPTIONS } from './shop.data';
import {
  PriceRange,
  Product,
  SortOption,
  SortOptionId,
} from './shop.model';
import { CartService } from '../../services/cart.service';
import { formatCurrency } from '../../shared/utils/currency';
import { environment } from '../../environment';

interface ApiProduct {
  id: number;
  name: string;
  price: number | string;
  stock: number;
  brand: string | null;
  size: string | null;
  season: string | null;
  vehicleType: string | null;
  imageUrl: string | null;
  description: string | null;
  active: boolean;
  category: {
    id: number;
    name: string;
  };
  createdAt?: string;
  createdDate?: string;
}

interface ApiProductPage {
  content: ApiProduct[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class ShopComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cartService = inject(CartService);
  private readonly http = inject(HttpClient);

  readonly products = signal<Product[]>([]);
  readonly isLoading = signal(false);

  readonly sortOptions: readonly SortOption[] = SORT_OPTIONS;

  readonly priceRanges: readonly PriceRange[] = PRICE_RANGES;

  readonly selectedSort = signal<SortOptionId>('alphabeticalAsc');
  readonly selectedBrands = signal<Set<string>>(new Set());
  readonly selectedPriceRange = signal<string | null>(null);
  readonly selectedWidth = signal<number | null>(null);
  readonly selectedProfile = signal<number | null>(null);
  readonly selectedDiameter = signal<number | null>(null);
  readonly isDrawerOpen = signal(false);

  readonly brandList = computed(() =>
    Array.from(new Set(this.products().map(product => product.brand).filter(b => b))).sort((a, b) =>
      (a || '').localeCompare(b || '')
    )
  );

  readonly widthOptions = computed(() =>
    Array.from(new Set(this.products().map(product => product.width).filter(w => w !== null && w !== undefined && w > 0))).sort((a, b) => a - b) as number[]
  );

  readonly profileOptions = computed(() =>
    Array.from(new Set(this.products().map(product => product.profile).filter(p => p !== null && p !== undefined && p > 0))).sort((a, b) => a - b) as number[]
  );

  readonly diameterOptions = computed(() =>
    Array.from(new Set(this.products().map(product => product.diameter).filter(d => d !== null && d !== undefined && d > 0))).sort((a, b) => a - b) as number[]
  );

  readonly brandCountMap = computed(() => {
    const counts = new Map<string, number>();
    for (const product of this.products()) {
      counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
    }
    return counts;
  });

  readonly filteredProducts = computed(() => {
    const selectedBrands = this.selectedBrands();
    const priceRangeId = this.selectedPriceRange();
    const width = this.selectedWidth();
    const profile = this.selectedProfile();
    const diameter = this.selectedDiameter();

    const range = priceRangeId ? this.priceRanges.find(item => item.id === priceRangeId) : null;

    return this.products().filter(product => {
      if (selectedBrands.size && !selectedBrands.has(product.brand)) {
        return false;
      }

      if (range) {
        if (range.min !== undefined && product.price < range.min) {
          return false;
        }
        if (range.max !== undefined && product.price >= range.max) {
          return false;
        }
      }

      if (width !== null && width > 0 && product.width !== width) {
        return false;
      }

      if (profile !== null && profile > 0 && product.profile !== profile) {
        return false;
      }

      if (diameter !== null && diameter > 0 && product.diameter !== diameter) {
        return false;
      }

      return true;
    });
  });

  readonly sortedProducts = computed(() => {
    const sortOrder = this.selectedSort();
    const items = [...this.filteredProducts()];

    switch (sortOrder) {
      case 'featured':
      case 'bestSelling':
        return items.sort((a, b) => a.salesRank - b.salesRank);
      case 'alphabeticalDesc':
        return items.sort((a, b) => b.name.localeCompare(a.name));
      case 'priceLowHigh':
        return items.sort((a, b) => a.price - b.price);
      case 'priceHighLow':
        return items.sort((a, b) => b.price - a.price);
      case 'dateOldNew':
        return items.sort((a, b) =>
          new Date(a.launchedAt).getTime() - new Date(b.launchedAt).getTime()
        );
      case 'dateNewOld':
        return items.sort((a, b) =>
          new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime()
        );
      default:
        return items.sort((a, b) => a.name.localeCompare(b.name));
    }
  });

  readonly totalProducts = computed(() => this.filteredProducts().length);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.applyQueryParams(params));

    this.destroyRef.onDestroy(() => this.toggleBodyScroll(false));
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  /**
   * Charge les produits depuis l'API
   */
  private loadProducts(): void {
    this.isLoading.set(true);
    
    // Charger tous les produits actifs avec une grande taille de page pour avoir tous les produits
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '1000'); // Taille maximale pour récupérer tous les produits

    this.http.get<ApiProductPage>(`${environment.apiUrl}/products/active`, { params })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const mappedProducts = response.content.map(apiProduct => this.mapApiProductToProduct(apiProduct));
          this.products.set(mappedProducts);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des produits:', error);
          this.isLoading.set(false);
          this.products.set([]);
        }
      });
  }

  /**
   * Convertit un produit API en produit frontend
   */
  private mapApiProductToProduct(apiProduct: ApiProduct): Product {
    const dimensions = this.parseDimensions(apiProduct.size);
    
    // Gérer le prix (BigDecimal de Java sérialisé en nombre)
    const price = typeof apiProduct.price === 'number' 
      ? apiProduct.price 
      : parseFloat(String(apiProduct.price)) || 0;
    
    // Gérer la date de création
    const createdAt = apiProduct.createdAt || apiProduct.createdDate || new Date().toISOString();
    
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      brand: apiProduct.brand || 'Autre',
      price,
      fromPrice: false,
      width: dimensions.width,
      profile: dimensions.profile,
      diameter: dimensions.diameter,
      image: apiProduct.imageUrl || '/assets/img/placeholder.png',
      launchedAt: createdAt,
      salesRank: 0
    };
  }

  /**
   * Parse les dimensions depuis le format "235/45R17" ou similaire
   */
  private parseDimensions(size: string | null): { width: number; profile: number; diameter: number } {
    if (!size) {
      return { width: 0, profile: 0, diameter: 0 };
    }

    // Formats possibles: "235/45R17", "235-45-17", "235/45/17", etc.
    const patterns = [
      /(\d+)\/(\d+)R?(\d+)/,  // 235/45R17 ou 235/4517
      /(\d+)[-\/](\d+)[-\/](\d+)/, // 235-45-17 ou 235/45/17
    ];

    for (const pattern of patterns) {
      const match = size.match(pattern);
      if (match) {
        return {
          width: parseInt(match[1], 10) || 0,
          profile: parseInt(match[2], 10) || 0,
          diameter: parseInt(match[3], 10) || 0
        };
      }
    }

    return { width: 0, profile: 0, diameter: 0 };
  }

  toggleBrand(brand: string): void {
    const updated = new Set(this.selectedBrands());
    if (updated.has(brand)) {
      updated.delete(brand);
    } else {
      updated.add(brand);
    }
    this.selectedBrands.set(updated);
  }

  isBrandSelected(brand: string): boolean {
    return this.selectedBrands().has(brand);
  }

  selectSort(sortId: string): void {
    const match = this.sortOptions.find(option => option.id === sortId);
    if (match) {
      this.selectedSort.set(match.id);
    }
  }

  selectPriceRange(rangeId: string): void {
    this.selectedPriceRange.set(this.selectedPriceRange() === rangeId ? null : rangeId);
  }

  isPriceRangeSelected(rangeId: string): boolean {
    return this.selectedPriceRange() === rangeId;
  }

  openFilters(): void {
    this.isDrawerOpen.set(true);
    this.toggleBodyScroll(true);
  }

  closeFilters(): void {
    this.isDrawerOpen.set(false);
    this.toggleBodyScroll(false);
  }

  applyFilters(): void {
    this.closeFilters();
  }

  onSortChange(event: Event): void {
    const selectElement = event.target instanceof HTMLSelectElement ? event.target : null;
    if (selectElement) {
      this.selectSort(selectElement.value);
    }
  }

  selectWidth(width: number): void {
    this.selectedWidth.set(this.selectedWidth() === width ? null : width);
  }

  isWidthSelected(width: number): boolean {
    return this.selectedWidth() === width;
  }

  selectProfile(profile: number): void {
    this.selectedProfile.set(this.selectedProfile() === profile ? null : profile);
  }

  isProfileSelected(profile: number): boolean {
    return this.selectedProfile() === profile;
  }

  selectDiameter(diameter: number): void {
    this.selectedDiameter.set(this.selectedDiameter() === diameter ? null : diameter);
  }

  isDiameterSelected(diameter: number): boolean {
    return this.selectedDiameter() === diameter;
  }

  clearFilters(): void {
    this.selectedBrands.set(new Set());
    this.selectedPriceRange.set(null);
    this.selectedWidth.set(null);
    this.selectedProfile.set(null);
    this.selectedDiameter.set(null);
    this.closeFilters();
  }

  formatPrice(value: number): string {
    return formatCurrency(value);
  }

  addToCart(product: Product): void {
    this.cartService.addItem(
      {
        productId: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        width: product.width,
        profile: product.profile,
        diameter: product.diameter
      },
      1
    );
  }

  getBrandCount(brand: string): number {
    return this.brandCountMap().get(brand) ?? 0;
  }

  private applyQueryParams(params: ParamMap): void {
    let shouldClear = false;

    const brand = params.get('brand');
    if (brand) {
      this.selectedBrands.set(new Set([brand]));
      shouldClear = true;
    }

    const width = this.parseNumberParam(params.get('width'));
    if (width !== null) {
      this.selectedWidth.set(width);
      shouldClear = true;
    }

    const profile = this.parseNumberParam(params.get('profile'));
    if (profile !== null) {
      this.selectedProfile.set(profile);
      shouldClear = true;
    }

    const diameter = this.parseNumberParam(params.get('diameter'));
    if (diameter !== null) {
      this.selectedDiameter.set(diameter);
      shouldClear = true;
    }

    if (shouldClear) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
  }

  private parseNumberParam(value: string | null): number | null {
    if (!value) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toggleBodyScroll(disable: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.body.style.overflow = disable ? 'hidden' : '';
  }
}

