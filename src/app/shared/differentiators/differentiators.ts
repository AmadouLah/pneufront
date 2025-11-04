import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type Differentiator = {
  title: string;
  description: string;
  icon: string;
  alt: string;
};

const DEFAULT_DIFFERENTIATORS: Differentiator[] = [
  {
    title: 'Notre Mission',
    description:
      'Révolutionner le marché malien du pneu en ligne en offrant une expérience e-commerce fluide. Nous proposons une large gamme de pneus premium à des tarifs compétitifs et un service client irréprochable tout en soutenant des initiatives locales.',
    icon: '/assets/img/targeting-2.avif',
    alt: 'Icône mission'
  },
  {
    title: 'Notre Vision',
    description:
      'Devenir la référence digitale du pneu au Mali grâce à une sélection complète, des prix justes et un engagement constant pour la qualité et l’innovation. Nous voulons instaurer un modèle responsable en lien étroit avec nos clients et partenaires.',
    icon: '/assets/img/binoculars.avif',
    alt: 'Icône vision'
  },
  {
    title: 'Notre Promesse',
    description:
      'Nous savons combien votre véhicule est essentiel. Nous le traitons avec le plus grand soin grâce à des technologies avancées d’alignement, de permutation et de montage pour garantir des performances optimales et une sécurité maximale.',
    icon: '/assets/img/handshake-3.avif',
    alt: 'Icône promesse'
  }
];

@Component({
  selector: 'app-differentiators',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-black py-20">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-4xl md:text-5xl font-semibold text-white mb-16">
          {{ title }}
        </h2>
        <div class="grid gap-16 md:grid-cols-3">
          @for (item of items; track item.title) {
          <article class="space-y-6 text-left">
            <div class="h-20 w-20">
              <img
                [src]="item.icon"
                [alt]="item.alt"
                class="h-full w-full object-contain drop-shadow-[0_20px_45px_rgba(0,217,255,0.35)]"
                loading="lazy"
              />
            </div>
            <h3 class="text-xl md:text-2xl font-semibold text-white">
              {{ item.title }}
            </h3>
            <p class="text-gray-300 leading-relaxed">
              {{ item.description }}
            </p>
          </article>
          }
        </div>
      </div>
    </section>
  `
})
export class DifferentiatorsComponent {
  @Input() title = 'La différence Pneu Mali';
  @Input() items: Differentiator[] = DEFAULT_DIFFERENTIATORS;
}


