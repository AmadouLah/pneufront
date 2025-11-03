import { Injectable, computed, effect, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartItem, CartItemPayload } from '../shared/types/cart';
import { environment } from '../environment';

interface ApiProduct {
  id: number;
  name: string;
  price: number | string;
  brand: string | null;
  size: string | null;
  imageUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private static readonly STORAGE_KEY = 'pneumali.cart.v1';
  private readonly http = inject(HttpClient);

  private readonly itemsSignal = signal<CartItem[]>(this.restoreFromStorage());
  private isSyncing = false;
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL = 30000; // Synchroniser toutes les 30 secondes maximum

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

    // Synchroniser les produits au démarrage
    this.syncProductsWithApi();
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

  /**
   * Force la synchronisation des produits avec l'API
   */
  syncNow(): void {
    this.lastSyncTime = 0; // Réinitialiser pour forcer la synchronisation
    this.syncProductsWithApi();
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

  /**
   * Synchronise les données des produits du panier avec l'API
   */
  private syncProductsWithApi(): void {
    const items = this.itemsSignal();
    const now = Date.now();
    
    if (items.length === 0 || this.isSyncing || (now - this.lastSyncTime) < this.SYNC_INTERVAL) {
      return;
    }

    this.isSyncing = true;
    this.lastSyncTime = now;

    // Récupérer les données à jour pour chaque produit
    const syncRequests = items.map(item =>
      this.http.get<ApiProduct>(`${environment.apiUrl}/products/${item.productId}`).pipe(
        map(product => ({
          item,
          product: {
            name: product.name,
            brand: product.brand || 'Autre',
            price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0,
            imageUrl: product.imageUrl || '/assets/img/placeholder.png',
            size: product.size || null
          }
        })),
        catchError(() => of({ item, product: null }))
      )
    );

    forkJoin(syncRequests).subscribe({
      next: (results) => {
        const updatedItems = results.map(({ item, product }) => {
          if (!product) {
            return item;
          }

          const dimensions = this.parseDimensions(product.size);
          return {
            ...item,
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: product.imageUrl,
            width: dimensions.width || item.width,
            profile: dimensions.profile || item.profile,
            diameter: dimensions.diameter || item.diameter
          };
        });

        this.itemsSignal.set(updatedItems);
        this.isSyncing = false;
      },
      error: () => {
        this.isSyncing = false;
      }
    });
  }

  /**
   * Parse les dimensions depuis le format "235/45R17" ou similaire
   */
  private parseDimensions(size: string | null): { width: number; profile: number; diameter: number } {
    if (!size) {
      return { width: 0, profile: 0, diameter: 0 };
    }

    const patterns = [
      /(\d+)\/(\d+)R?(\d+)/,
      /(\d+)[-\/](\d+)[-\/](\d+)/
    ];

    for (const pattern of patterns) {
      const match = size.match(pattern);
      if (match) {
        return {
          width: parseInt(match[1], 10) || 0,
          profile: parseInt(match[2], 10) || 0,
          diameter: parseInt(match[3], 10) || 0
        };
      }
    }

    return { width: 0, profile: 0, diameter: 0 };
  }
}

