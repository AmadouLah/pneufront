import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Authservice } from '../../services/authservice';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit, OnDestroy {
  private auth = inject(Authservice);
  private http = inject(HttpClient);
  private router = inject(Router);
  
  sidebarOpen = false;
  isAdminOrDeveloper = false;
  private toggleListener: any;

  // Compteurs pour les badges
  countProducts: number | null = null;
  countOrders: number | null = null;
  countCustomers: number | null = null;
  countPendingOrders: number | null = null;

  ngOnInit(): void {
    // Vérifier si l'utilisateur est admin ou développeur
    const user = this.auth.authUser();
    this.isAdminOrDeveloper = user?.role === 'ADMIN' || user?.role === 'DEVELOPER';
    
    // Écouter les événements de toggle du sidebar
    this.toggleListener = (event: any) => {
      this.sidebarOpen = event.detail.open;
    };
    window.addEventListener('toggle-sidebar', this.toggleListener);

    // Charger les compteurs
    this.loadCounters();
  }

  ngOnDestroy(): void {
    if (this.toggleListener) {
      window.removeEventListener('toggle-sidebar', this.toggleListener);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      this.auth.logout(refreshToken).subscribe({
        next: () => {
          this.auth.clearAuthData();
          this.router.navigate(['/']);
        },
        error: () => {
          this.auth.clearAuthData();
          this.router.navigate(['/']);
        }
      });
    } else {
      this.auth.clearAuthData();
      this.router.navigate(['/']);
    }
  }

  /**
   * Charge les compteurs depuis l'API
   */
  private async loadCounters(): Promise<void> {
    try {
      const base = environment.apiUrl;
      
      // Charger les compteurs en parallèle (ignorer les erreurs individuelles)
      const [products, orders, customers] = await Promise.allSettled([
        this.http.get<any>(`${base}/products`).toPromise(),
        this.http.get<any>(`${base}/orders`).toPromise(),
        this.http.get<any>(`${base}/admin/users`).toPromise()
      ]);

      // Extraire les compteurs
      if (products.status === 'fulfilled' && products.value) {
        this.countProducts = Array.isArray(products.value) ? products.value.length : products.value.totalElements || null;
      }
      
      if (orders.status === 'fulfilled' && orders.value) {
        const ordersData = Array.isArray(orders.value) ? orders.value : orders.value.content || [];
        this.countOrders = Array.isArray(ordersData) ? ordersData.length : orders.value.totalElements || null;
        this.countPendingOrders = Array.isArray(ordersData) 
          ? ordersData.filter((o: any) => o.status === 'PENDING').length 
          : null;
      }
      
      if (customers.status === 'fulfilled' && customers.value) {
        this.countCustomers = Array.isArray(customers.value) ? customers.value.length : customers.value.totalElements || null;
      }
    } catch {
      // Ignorer les erreurs pour ne pas casser le sidebar
    }
  }
}
