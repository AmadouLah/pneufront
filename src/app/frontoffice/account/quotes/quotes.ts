import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { QuoteService } from '../../../services/quote.service';
import { QuoteResponse } from '../../../shared/types/quote';
import { formatCurrency } from '../../../shared/utils/currency';

@Component({
  selector: 'app-account-quotes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quotes.html',
  styleUrls: ['./quotes.css']
})
export class AccountQuotesComponent implements OnInit {
  private readonly quoteService = inject(QuoteService);

  readonly quotes = signal<QuoteResponse[]>([]);
  readonly selected = signal<QuoteResponse | null>(null);
  readonly loading = signal(false);
  readonly feedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);

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

  validateQuote(): void {
    const quote = this.selected();
    if (!quote) {
      return;
    }
    this.quoteService.validateQuote(quote.id).subscribe({
      next: (updated) => {
        this.feedback.set({ type: 'success', message: 'Merci ! Votre devis est validé.' });
        this.selected.set(updated);
        this.loadQuotes();
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de valider ce devis.' });
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

