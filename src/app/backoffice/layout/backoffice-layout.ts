import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { Authservice } from '../../services/authservice';

/**
 * Layout principal du backoffice
 * Contient le header, sidebar et le contenu principal (dashboard, etc.)
 */
@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar, FormsModule],
  templateUrl: './backoffice-layout.html',
  styleUrl: './backoffice-layout.css'
})
export class BackofficeLayoutComponent implements OnInit {
  sidebarOpen = false;
  userMenuOpen = signal(false);
  searchQuery = '';
  notificationCount = 3;

  constructor(
    private authService: Authservice,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialisation si nécessaire
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    window.dispatchEvent(new CustomEvent('toggle-sidebar', { detail: { open: this.sidebarOpen } }));
  }

  toggleUserMenu(): void {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  /**
   * Récupère les informations de l'utilisateur connecté
   */
  getUserInfo(): any {
    return this.authService.authUser();
  }

  /**
   * Génère les initiales de l'utilisateur pour l'avatar
   */
  getUserInitials(): string {
    const user = this.getUserInfo();
    if (!user) return 'U';

    const firstName = user.firstName?.trim() || '';
    const lastName = user.lastName?.trim() || '';

    if (lastName && firstName) {
      return (lastName.charAt(0) + firstName.charAt(0)).toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }

    return 'U';
  }

  /**
   * Retourne un message de salutation selon l'heure
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  /**
   * Gère la recherche
   */
  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Recherche:', this.searchQuery);
      // TODO: Implémenter la recherche
    }
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
          this.router.navigate(['/']);
        },
        error: () => {
          this.authService.clearAuthData();
          this.router.navigate(['/']);
        }
      });
    } else {
      this.authService.clearAuthData();
      this.router.navigate(['/']);
    }
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
   * Navigation
   */
  navigateTo(route: string): void {
    this.closeUserMenu();
    this.router.navigate([route]);
  }
}

