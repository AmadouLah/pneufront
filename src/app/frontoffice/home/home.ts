import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { DifferentiatorsComponent } from '../../shared/differentiators/differentiators';
import { environment } from '../../environment';

interface TireDimension {
  id: number;
  value: number;
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
  /**
   * Catégories de pneus
   */
  categories = [
    {
      title: 'Pneus Voiture',
      description: 'Large gamme de pneus pour véhicules légers',
      icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z',
      path: '/shop/auto'
    },
    {
      title: 'Pneus 4x4 & SUV',
      description: 'Pneus robustes pour tous les terrains',
      icon: 'M8 17a2 2 0 11-4 0 2 2 0 014 0zM20 17a2 2 0 11-4 0 2 2 0 014 0z',
      path: '/shop/4x4'
    },
    {
      title: 'Pneus Moto',
      description: 'Performance et sécurité maximales',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      path: '/shop/moto'
    }
  ];

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
}

