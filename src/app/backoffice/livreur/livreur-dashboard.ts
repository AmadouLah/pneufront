import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { LivreurService, DeliveryDto } from '../../services/livreur.service';
import { QuoteResponse } from '../../shared/types/quote';
import { formatCurrency } from '../../shared/utils/currency';

@Component({
  selector: 'app-livreur-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './livreur-dashboard.html',
  styleUrls: ['./livreur-dashboard.css']
})
export class LivreurDashboardComponent implements OnInit {
  private readonly livreurService = inject(LivreurService);

  readonly quotes = signal<QuoteResponse[]>([]);
  readonly deliveries = signal<DeliveryDto[]>([]);

  readonly loadingQuotes = signal(false);
  readonly loadingDeliveries = signal(false);
  readonly feedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  ngOnInit(): void {
    this.loadQuotes();
    this.loadDeliveries();
  }

  loadQuotes(): void {
    this.loadingQuotes.set(true);
    this.livreurService.getAssignedQuotes().subscribe({
      next: (quotes) => {
        this.quotes.set(quotes);
        this.loadingQuotes.set(false);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de charger les devis assignés.' });
        this.loadingQuotes.set(false);
      }
    });
  }

  loadDeliveries(): void {
    this.loadingDeliveries.set(true);
    this.livreurService.getAssignedDeliveries().subscribe({
      next: (deliveries) => {
        this.deliveries.set(deliveries);
        this.loadingDeliveries.set(false);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de charger les livraisons.' });
        this.loadingDeliveries.set(false);
      }
    });
  }

  completeQuote(quote: QuoteResponse): void {
    this.livreurService.completeQuote(quote.id).subscribe({
      next: () => {
        this.feedback.set({ type: 'success', message: 'Livraison du devis confirmée.' });
        this.loadQuotes();
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de confirmer la livraison du devis.' });
      }
    });
  }

  completeDelivery(delivery: DeliveryDto): void {
    this.livreurService.completeDelivery(delivery.id).subscribe({
      next: () => {
        this.feedback.set({ type: 'success', message: 'Livraison terminée.' });
        this.loadDeliveries();
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de terminer la livraison.' });
      }
    });
  }

  formatPrice(value: number | null | undefined): string {
    if (typeof value !== 'number') {
      return '-';
    }
    return formatCurrency(value);
  }
}

