import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';

interface BlogPost {
  readonly id: number;
  readonly title: string;
  readonly excerpt: string;
  readonly publishedAt: string;
  readonly readTime: string;
  readonly image: string;
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './blog.html',
  styleUrls: ['./blog.css']
})
export class BlogComponent {
  readonly hero = {
    title: 'PneuMali Magazine',
    subtitle:
      'Conseils d\'experts, actualités du marché et guides d\'achat pour des pneus performants au Mali.',
    cta: 'Explorer les articles',
    image: '/assets/img/pneublog.png'
  } as const;

  readonly posts: readonly BlogPost[] = [
    {
      id: 1,
      title: 'Comment choisir les pneus adaptés au climat malien',
      excerpt:
        'Tout ce qu\'il faut savoir pour optimiser l\'adhérence et la longévité de vos pneus sur les routes maliennes.',
      publishedAt: '4 février 2025',
      readTime: '6 min de lecture',
      image: '/assets/img/pneublog.png'
    },
    {
      id: 2,
      title: 'Guide d\'entretien : prolonger la durée de vie de vos pneus',
      excerpt:
        'Pression, rotation, équilibrage… découvrez le plan d\'entretien idéal pour préserver vos performances.',
      publishedAt: '18 janvier 2025',
      readTime: '5 min de lecture',
      image: '/assets/img/pneublog.png'
    },
    {
      id: 3,
      title: 'Les nouveautés pneus SUV 2025 disponibles chez PneuMali',
      excerpt:
        'Zoom sur les dernières références dédiées aux SUV et pick-up, prêtes à affronter toutes les pistes.',
      publishedAt: '7 janvier 2025',
      readTime: '4 min de lecture',
      image: '/assets/img/pneublog.png'
    },
    {
      id: 4,
      title: 'Sécurité : quand faut-il remplacer ses pneus ?',
      excerpt:
        'Signes d\'usure, profondeur de sculpture et contrôles indispensables pour une conduite en toute confiance.',
      publishedAt: '28 décembre 2024',
      readTime: '7 min de lecture',
      image: '/assets/img/pneublog.png'
    }
  ];
}


