import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { QuoteService } from '../../../services/quote.service';
import { QuoteResponse, QuoteStatus } from '../../../shared/types/quote';
import { formatCurrency } from '../../../shared/utils/currency';
import { getQuoteStatusDisplay, getQuoteStatusColor, QuoteStatusColor } from '../../../shared/utils/quote-status';

@Component({
  selector: 'app-account-quotes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quotes.html',
  styleUrls: ['./quotes.css'],
  providers: [DatePipe]
})
export class AccountQuotesComponent implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly datePipe = inject(DatePipe);

  readonly quotes = signal<QuoteResponse[]>([]);
  readonly selected = signal<QuoteResponse | null>(null);
  readonly loading = signal(false);
  readonly feedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  readonly showDeliveryDateModal = signal(false);
  readonly requestedDeliveryDate = signal<string>('');

  ngOnInit(): void {
    this.loadQuotes();
  }

  loadQuotes(): void {
    this.loading.set(true);
    this.quoteService.getMyQuotes().subscribe({
      next: (quotes) => {
        this.quotes.set(quotes);
        this.loading.set(false);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de charger vos devis pour le moment.' });
        this.loading.set(false);
      }
    });
  }

  openQuote(quote: QuoteResponse): void {
    this.quoteService.getQuoteById(quote.id).subscribe({
      next: (full) => {
        this.selected.set(full);
        this.feedback.set(null);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de charger ce devis.' });
      }
    });
  }

  openDeliveryDateModal(): void {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1);
    this.requestedDeliveryDate.set(minDate.toISOString().split('T')[0]);
    this.showDeliveryDateModal.set(true);
  }

  getMinDeliveryDate(): string {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1);
    return minDate.toISOString().split('T')[0];
  }

  closeDeliveryDateModal(): void {
    this.showDeliveryDateModal.set(false);
    this.requestedDeliveryDate.set('');
  }

  validateQuote(): void {
    const quote = this.selected();
    if (!quote) {
      return;
    }
    const deliveryDate = this.requestedDeliveryDate();
    if (!deliveryDate) {
      this.feedback.set({ type: 'error', message: 'Veuillez sélectionner une date de livraison.' });
      return;
    }
    
    this.loading.set(true);
    this.quoteService.validateQuote(quote.id, deliveryDate).subscribe({
      next: (updated) => {
        this.feedback.set({ type: 'success', message: 'Merci ! Votre devis est validé. Un livreur vous contactera prochainement.' });
        this.selected.set(updated);
        this.loadQuotes();
        this.closeDeliveryDateModal();
        this.loading.set(false);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de valider ce devis.' });
        this.loading.set(false);
      }
    });
  }

  confirmDelivery(): void {
    const quote = this.selected();
    if (!quote) {
      return;
    }
    this.loading.set(true);
    this.quoteService.confirmDelivery(quote.id).subscribe({
      next: (updated) => {
        this.feedback.set({ type: 'success', message: 'Merci ! Votre commande est confirmée.' });
        this.selected.set(updated);
        this.loadQuotes();
        this.loading.set(false);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de confirmer la livraison.' });
        this.loading.set(false);
      }
    });
  }

  formatPrice(value: number | null | undefined): string {
    if (typeof value !== 'number') {
      return '-';
    }
    return formatCurrency(value);
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return '-';
    }
    return this.datePipe.transform(dateString, 'dd/MM/yyyy') || '-';
  }

  getStatusLabel(status: QuoteStatus): string {
    return getQuoteStatusDisplay(status);
  }

  getStatusColor(status: QuoteStatus): QuoteStatusColor {
    return getQuoteStatusColor(status);
  }
}

