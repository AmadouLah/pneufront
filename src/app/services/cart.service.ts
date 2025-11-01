import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem, CartItemPayload } from '../shared/types/cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private static readonly STORAGE_KEY = 'pneumali.cart.v1';

  private readonly itemsSignal = signal<CartItem[]>(this.restoreFromStorage());

  private readonly itemsComputed = computed(() => this.itemsSignal());
  private readonly totalItemsComputed = computed(() =>
    this.itemsSignal().reduce((total, item) => total + item.quantity, 0)
  );
  private readonly subtotalComputed = computed(() =>
    this.itemsSignal().reduce((total, item) => total + item.price * item.quantity, 0)
  );

  constructor() {
    effect(() => {
      if (typeof window === 'undefined') {
        return;
      }

      const serialized = JSON.stringify(this.itemsSignal());
      window.localStorage.setItem(CartService.STORAGE_KEY, serialized);
    });
  }

  items(): CartItem[] {
    return this.itemsComputed();
  }

  totalItems(): number {
    return this.totalItemsComputed();
  }

  subtotal(): number {
    return this.subtotalComputed();
  }

  addItem(payload: CartItemPayload, quantity = 1): void {
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;

    this.itemsSignal.update(items => {
      const existingIndex = items.findIndex(item => item.productId === payload.productId);
      if (existingIndex === -1) {
        return [...items, { ...payload, quantity: safeQuantity }];
      }

      const updated = [...items];
      const existing = updated[existingIndex];
      updated[existingIndex] = {
        ...existing,
        quantity: existing.quantity + safeQuantity
      };
      return updated;
    });
  }

  incrementQuantity(productId: number): void {
    this.itemsSignal.update(items =>
      items.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  decrementQuantity(productId: number): void {
    this.itemsSignal.update(items =>
      items
        .map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  updateQuantity(productId: number, quantity: number): void {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    const safeQuantity = Math.floor(quantity);

    this.itemsSignal.update(items =>
      items.map(item =>
        item.productId === productId ? { ...item, quantity: safeQuantity } : item
      )
    );
  }

  removeItem(productId: number): void {
    this.itemsSignal.update(items => items.filter(item => item.productId !== productId));
  }

  clear(): void {
    this.itemsSignal.set([]);
  }

  private restoreFromStorage(): CartItem[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const raw = window.localStorage.getItem(CartService.STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter(this.isValidCartItem)
        .map(item => {
          const productId = Number(item['productId']);
          const name = String(item['name']);
          const brand = String(item['brand']);
          const price = Number(item['price']);
          const image = String(item['image']);
          const width = this.extractOptionalNumber(item['width']);
          const profile = this.extractOptionalNumber(item['profile']);
          const diameter = this.extractOptionalNumber(item['diameter']);
          const quantity = Math.max(1, Math.floor(Number(item['quantity']) || 1));

          return {
            productId,
            name,
            brand,
            price,
            image,
            width,
            profile,
            diameter,
            quantity
          } satisfies CartItem;
        });
    } catch (error) {
      console.error('Erreur lors de la lecture du panier depuis le stockage local', error);
      return [];
    }
  }

  private isValidCartItem(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const record = value as Record<string, unknown>;
    return (
      'productId' in record &&
      'name' in record &&
      'brand' in record &&
      'price' in record &&
      'image' in record &&
      'quantity' in record
    );
  }

  private extractOptionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}

