import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../shared/types/cart';
import { formatCurrency } from '../../shared/utils/currency';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit {
  readonly items = computed(() => this.cartService.items());
  readonly subtotal = computed(() => this.cartService.subtotal());
  readonly total = computed(() => this.cartService.total());
  readonly discountAmount = computed(() => this.cartService.discountAmount());
  readonly promoCode = computed(() => this.cartService.promoCode());
  readonly totalItems = computed(() => this.cartService.totalItems());
  readonly hasItems = computed(() => this.totalItems() > 0);

  promoCodeInput = signal('');
  isApplyingPromo = signal(false);
  promoMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  constructor(private readonly cartService: CartService) {}

  ngOnInit(): void {
    // Synchroniser les produits lors de l'ouverture de la page panier
    this.cartService.syncNow();
  }

  trackByProductId(_: number, item: CartItem): number {
    return item.productId;
  }

  formatPrice(value: number): string {
    return formatCurrency(value);
  }

  increment(item: CartItem): void {
    this.cartService.incrementQuantity(item.productId);
  }

  decrement(item: CartItem): void {
    this.cartService.decrementQuantity(item.productId);
  }

  remove(item: CartItem): void {
    this.cartService.removeItem(item.productId);
  }

  clear(): void {
    this.cartService.clear();
    this.promoCodeInput.set('');
    this.promoMessage.set(null);
  }

  async applyPromoCode(): Promise<void> {
    const code = this.promoCodeInput().trim();
    if (!code) {
      this.promoMessage.set({ type: 'error', text: 'Veuillez saisir un code promo' });
      return;
    }

    this.isApplyingPromo.set(true);
    this.promoMessage.set(null);

    const result = await this.cartService.applyPromoCode(code);
    this.promoMessage.set({
      type: result.success ? 'success' : 'error',
      text: result.message
    });

    if (result.success) {
      this.promoCodeInput.set('');
      setTimeout(() => this.promoMessage.set(null), 5000);
    }

    this.isApplyingPromo.set(false);
  }

  removePromoCode(): void {
    this.cartService.removePromoCode();
    this.promoCodeInput.set('');
    this.promoMessage.set(null);
  }
}

