import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Authservice } from '../../services/authservice';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  mobileMenuOpen = signal(false);
  mobileMenuSection = signal<'root' | 'brands'>('root');
  searchOpen = signal(false);
  userMenuOpen = signal(false);
  isAuthenticated = signal(false);
  readonly cartItemCount = computed(() => this.cartService.totalItems());
  searchForm: FormGroup;

  brands = ['Michelin', 'Bridgestone', 'Goodyear', 'Continental', 'Pirelli', 'Dunlop'];

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
   * Vérifie si l'utilisateur connecté est un administrateur ou développeur
   * @returns true si ADMIN ou DEVELOPER, false sinon
   */
  isAdminOrDeveloper(): boolean {
    const user = this.getUserInfo();
    if (!user?.role) return false;
    return user.role === 'ADMIN' || user.role === 'DEVELOPER';
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
   * Filtrer par marque
   */
  filterByBrand(brand: string): void {
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

