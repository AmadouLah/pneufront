import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
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
export class CartComponent {
  readonly items = computed(() => this.cartService.items());
  readonly subtotal = computed(() => this.cartService.subtotal());
  readonly totalItems = computed(() => this.cartService.totalItems());
  readonly hasItems = computed(() => this.totalItems() > 0);

  constructor(private readonly cartService: CartService) {}

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
  }
}

