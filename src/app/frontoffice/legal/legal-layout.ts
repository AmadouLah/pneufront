import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';

/**
 * Layout commun pour toutes les pages légales
 * Évite la duplication du header/footer
 */
@Component({
  selector: 'app-legal-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-header></app-header>
      
      <main class="flex-1 container mx-auto px-4 py-12">
        <article class="prose prose-lg max-w-4xl mx-auto">
          <h1 class="text-4xl font-bold mb-8">{{ title }}</h1>
          <ng-content></ng-content>
        </article>
      </main>
      
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .prose h1 {
      color: hsl(var(--p));
    }
    
    .prose h2 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    
    .prose h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    
    .prose p {
      margin-bottom: 1rem;
      line-height: 1.75;
    }
    
    .prose ul, .prose ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .prose li {
      margin-bottom: 0.5rem;
    }
  `]
})
export class LegalLayoutComponent {
  @Input() title: string = '';
}

