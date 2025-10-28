import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Authservice } from '../../services/authservice';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  mobileMenuOpen = signal(false);
  searchOpen = signal(false);
  userMenuOpen = signal(false);
  isAuthenticated = signal(false);
  cartItemCount = signal(0);
  searchForm: FormGroup;

  brands = ['Michelin', 'Bridgestone', 'Goodyear', 'Continental', 'Pirelli', 'Dunlop'];

  constructor(
    private authService: Authservice,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      width: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      profile: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      diameter: ['', [Validators.required, Validators.pattern(/^\d+$/)]]
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
   * Toggle du menu mobile
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
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
    if (this.searchForm.valid) {
      const { width, profile, diameter } = this.searchForm.value;
      this.router.navigate(['/shop'], { 
        queryParams: { 
          width, 
          profile, 
          diameter 
        } 
      });
      this.toggleSearch();
    }
  }
}

