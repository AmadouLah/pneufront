import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { DifferentiatorsComponent } from '../../shared/differentiators/differentiators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, DifferentiatorsComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
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
}

