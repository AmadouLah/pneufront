import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CartService } from '../../services/cart.service';
import { QuoteService } from '../../services/quote.service';
import { formatCurrency } from '../../shared/utils/currency';

@Component({
  selector: 'app-quote-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './quote-request.html',
  styleUrls: ['./quote-request.css']
})
export class QuoteRequestComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly quoteService = inject(QuoteService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly items = computed(() => this.cartService.items());
  readonly subtotal = computed(() => this.cartService.subtotal());
  readonly hasItems = computed(() => this.cartService.totalItems() > 0);

  readonly form = this.fb.group({
    message: ['', [Validators.maxLength(2000)]]
  });

  readonly isSubmitting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  ngOnInit(): void {
    if (!this.hasItems()) {
      this.router.navigate(['/cart']);
    }
  }

  formatPrice(value: number): string {
    return formatCurrency(value);
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }

  async submit(): Promise<void> {
    if (!this.hasItems() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const trimmedMessage = this.form.value.message?.trim() ?? '';
    const payload = {
      message: trimmedMessage.length > 0 ? trimmedMessage : undefined,
      items: this.items().map((item) => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    if (!payload.items.length) {
      this.errorMessage.set('Votre panier est vide.');
      this.isSubmitting.set(false);
      return;
    }

    try {
      await firstValueFrom(this.quoteService.submitQuoteRequest(payload));
      this.cartService.clear();
      this.successMessage.set('Votre demande de devis a été envoyée. Nous vous contacterons rapidement.');
      this.form.reset();
      setTimeout(() => {
        this.goBack();
      }, 3000);
    } catch (error: any) {
      const message = error?.error?.error || 'Impossible d\'envoyer la demande de devis pour le moment.';
      this.errorMessage.set(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

