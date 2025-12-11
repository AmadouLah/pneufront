import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Authservice } from '../../services/authservice';
import { CartService } from '../../services/cart.service';
import { environment } from '../../environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent implements OnInit {
  private readonly http = inject(HttpClient);
  
  mobileMenuOpen = signal(false);
  mobileMenuSection = signal<'root' | 'brands'>('root');
  searchOpen = signal(false);
  userMenuOpen = signal(false);
  brandsDropdownOpen = signal(false);
  isAuthenticated = signal(false);
  readonly cartItemCount = computed(() => this.cartService.totalItems());
  searchForm: FormGroup;

  readonly brands = signal<string[]>([]);

  constructor(
    private authService: Authservice,
    private router: Router,
    private fb: FormBuilder,
    private cartService: CartService
  ) {
    this.searchForm = this.fb.group({
      keyword: ['', [Validators.required, Validators.minLength(2)]]
    });
    this.checkAuthStatus();
  }

  ngOnInit(): void {
    this.loadBrands();
    // Vérifier le chargement des marques après un court délai
    setTimeout(() => {
      if (this.brands().length === 0) {
        console.warn('Aucune marque chargée depuis l\'API');
      }
    }, 1000);
  }

  /**
   * Vérifie le statut d'authentification
   */
  private checkAuthStatus(): void {
    this.isAuthenticated.set(this.authService.isLoggedIn());
  }

  /**
   * Récupère les informations de l'utilisateur connecté
   */
  getUserInfo(): any {
    return this.authService.authUser();
  }

  /**
   * Vérifie si l'utilisateur a renseigné son nom ou prénom
   */
  hasUserName(): boolean {
    const user = this.getUserInfo();
    if (!user) return false;
    
    const firstName = user.firstName?.trim() || '';
    const lastName = user.lastName?.trim() || '';
    
    return !!(firstName || lastName);
  }

  /**
   * Génère les initiales de l'utilisateur
   * - Si nom + prénom : "LA" (Landouré Amadou)
   * - Si seulement prénom : "A" (Amadou)
   * - Si seulement nom : "L" (Landouré)
   */
  getUserInitials(): string {
    const user = this.getUserInfo();
    if (!user) return '';

    const firstName = user.firstName?.trim() || '';
    const lastName = user.lastName?.trim() || '';

    if (lastName && firstName) {
      // Nom + Prénom : première lettre du nom + première lettre du prénom
      return (lastName.charAt(0) + firstName.charAt(0)).toUpperCase();
    } else if (firstName) {
      // Seulement prénom : première lettre du prénom
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      // Seulement nom : première lettre du nom
      return lastName.charAt(0).toUpperCase();
    }

    return '';
  }

  /**
   * Vérifie si l'utilisateur connecté est un administrateur, développeur ou influenceur
   * @returns true si ADMIN, DEVELOPER ou INFLUENCEUR, false sinon
   */
  isAdminOrDeveloper(): boolean {
    const user = this.getUserInfo();
    if (!user?.role) return false;
    return user.role === 'ADMIN' || user.role === 'DEVELOPER' || user.role === 'INFLUENCEUR';
  }

  /**
   * Vérifie si l'utilisateur est un livreur
   */
  isLivreur(): boolean {
    const user = this.getUserInfo();
    return user?.role === 'LIVREUR';
  }

  /**
   * Retourne la route du dashboard selon le rôle de l'utilisateur
   */
  getDashboardRoute(): string {
    return this.isLivreur() ? '/dashboard/livreur' : '/dashboard';
  }

  /**
   * Toggle du menu mobile
   */
  toggleMobileMenu(): void {
    const next = !this.mobileMenuOpen();
    this.mobileMenuOpen.set(next);
    if (!next) {
      this.mobileMenuSection.set('root');
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.mobileMenuSection.set('root');
  }

  openMobileBrands(): void {
    this.mobileMenuSection.set('brands');
  }

  backToMobileRoot(): void {
    this.mobileMenuSection.set('root');
  }

  navigateFromMobile(route: string): void {
    this.router.navigate([route]);
    this.closeMobileMenu();
  }

  handleBrandSelection(brand: string): void {
    this.filterByBrand(brand);
    this.closeMobileMenu();
  }

  openSearchFromMobile(): void {
    this.closeMobileMenu();
    if (!this.searchOpen()) {
      this.toggleSearch();
    }
  }

  /**
   * Toggle du modal de recherche
   */
  toggleSearch(): void {
    this.searchOpen.set(!this.searchOpen());
    if (this.searchOpen()) {
      this.searchForm.reset();
    }
  }

  /**
   * Toggle du menu utilisateur
   */
  toggleUserMenu(): void {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  /**
   * Ferme le menu utilisateur
   */
  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  /**
   * Toggle du dropdown des marques
   */
  toggleBrandsDropdown(): void {
    this.brandsDropdownOpen.set(!this.brandsDropdownOpen());
  }

  /**
   * Ferme le dropdown des marques
   */
  closeBrandsDropdown(): void {
    this.brandsDropdownOpen.set(false);
  }

  /**
   * Navigation vers la page de connexion
   */
  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Navigation vers le panier
   */
  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.closeUserMenu();
    this.closeMobileMenu();
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.authService.logout(refreshToken).subscribe({
        next: () => {
          this.authService.clearAuthData();
          this.isAuthenticated.set(false);
          this.router.navigate(['/']);
        },
        error: () => {
          this.authService.clearAuthData();
          this.isAuthenticated.set(false);
          this.router.navigate(['/']);
        }
      });
    } else {
      this.authService.clearAuthData();
      this.isAuthenticated.set(false);
      this.router.navigate(['/']);
    }
  }

  /**
   * Navigation vers une page et fermeture du menu
   */
  navigateAndCloseMenu(route: string): void {
    this.closeUserMenu();
    this.router.navigate([route]);
  }

  /**
   * Charge les marques depuis l'API
   */
  private loadBrands(): void {
    interface ApiBrand {
      id: number;
      name: string;
      active: boolean;
    }

    this.http.get<ApiBrand[]>(`${environment.apiUrl}/brands/active`).subscribe({
      next: (brands) => {
        const brandNames = brands
          .filter(brand => brand.active)
          .map(brand => brand.name)
          .sort((a, b) => a.localeCompare(b));
        this.brands.set(brandNames);
        console.log('Marques chargées:', brandNames);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des marques:', error);
        // En cas d'erreur, utiliser des marques par défaut
        this.brands.set(['Michelin', 'Bridgestone', 'Goodyear', 'Continental', 'Pirelli', 'Dunlop']);
      }
    });
  }

  /**
   * Filtrer par marque
   */
  filterByBrand(brand: string): void {
    this.closeBrandsDropdown();
    this.router.navigate(['/shop'], { queryParams: { brand } });
  }

  /**
   * Rechercher un produit par dimensions
   */
  onSearch(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const keyword = this.searchForm.value.keyword?.trim();
    if (!keyword) {
      return;
    }

    this.router.navigate(['/shop'], {
      queryParams: { q: keyword }
    });
    this.toggleSearch();
  }
}

