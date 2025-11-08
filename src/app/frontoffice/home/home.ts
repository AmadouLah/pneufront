import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { DifferentiatorsComponent } from '../../shared/differentiators/differentiators';
import { environment } from '../../environment';
import { formatCurrency } from '../../shared/utils/currency';

interface TireDimension {
  id: number;
  value: number;
}

interface ProductPreview {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  category?: { id: number; name: string };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent, FooterComponent, DifferentiatorsComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly selectedWidth = signal<string>('');
  readonly selectedProfile = signal<string>('');
  readonly selectedDiameter = signal<string>('');
  readonly widths = signal<TireDimension[]>([]);
  readonly profiles = signal<TireDimension[]>([]);
  readonly diameters = signal<TireDimension[]>([]);

  readonly latestProducts = signal<ProductPreview[]>([]);
  readonly isLoadingLatest = signal(false);
  readonly latestError = signal('');
  /**
   * Marques populaires (exemples)
   */
  brands = [
    { name: 'Michelin' },
    { name: 'Bridgestone' },
    { name: 'Goodyear' },
    { name: 'Continental' },
    { name: 'Pirelli' }
  ];

  ngOnInit(): void {
    this.loadDimensions();
    this.loadLatestProducts();
  }

  /**
   * Charge les dimensions depuis l'API
   */
  private loadDimensions(): void {
    this.http.get<TireDimension[]>(`${environment.apiUrl}/tire-dimensions/widths`).subscribe({
      next: (widths) => this.widths.set(widths),
      error: () => this.widths.set([])
    });

    this.http.get<TireDimension[]>(`${environment.apiUrl}/tire-dimensions/profiles`).subscribe({
      next: (profiles) => this.profiles.set(profiles),
      error: () => this.profiles.set([])
    });

    this.http.get<TireDimension[]>(`${environment.apiUrl}/tire-dimensions/diameters`).subscribe({
      next: (diameters) => this.diameters.set(diameters),
      error: () => this.diameters.set([])
    });
  }

  /**
   * Charge les derniers pneus ajoutés
   */
  private loadLatestProducts(): void {
    this.isLoadingLatest.set(true);
    this.latestError.set('');

    this.http
      .get<ProductPreview[]>(`${environment.apiUrl}/products/latest`, {
        params: { limit: 3 }
      })
      .subscribe({
        next: (products) => {
          this.latestProducts.set(products ?? []);
          this.isLoadingLatest.set(false);
        },
        error: () => {
          this.latestProducts.set([]);
          this.latestError.set('Impossible de charger les produits les plus récents pour le moment.');
          this.isLoadingLatest.set(false);
        }
      });
  }

  /**
   * Navigation vers la page Shop avec les filtres de dimensions
   */
  searchBySize(): void {
    const queryParams: Record<string, string> = {};

    const width = this.selectedWidth();
    if (width && width !== '') {
      queryParams['width'] = width;
    }

    const profile = this.selectedProfile();
    if (profile && profile !== '') {
      queryParams['profile'] = profile;
    }

    const diameter = this.selectedDiameter();
    if (diameter && diameter !== '') {
      queryParams['diameter'] = diameter;
    }

    this.router.navigate(['/shop'], { queryParams });
  }

  /**
   * Gère le changement de sélection pour la largeur
   */
  onWidthChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedWidth.set(select.value);
  }

  /**
   * Gère le changement de sélection pour le profil
   */
  onProfileChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedProfile.set(select.value);
  }

  /**
   * Gère le changement de sélection pour le diamètre
   */
  onDiameterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedDiameter.set(select.value);
  }

  formatPrice(value: number | null | undefined): string {
    if (typeof value !== 'number') {
      return '-';
    }
    return formatCurrency(value);
  }
}

