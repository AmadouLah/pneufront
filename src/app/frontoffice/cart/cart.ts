import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CartService } from '../../services/cart.service';
import { PaymentService } from '../../services/payment.service';
import { Authservice } from '../../services/authservice';
import { CartItem } from '../../shared/types/cart';
import { formatCurrency } from '../../shared/utils/currency';
import { firstValueFrom } from 'rxjs';

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
  
  isProcessingPayment = signal(false);
  paymentMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly authService = inject(Authservice);

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

  requestQuote(): void {
    if (!this.hasItems()) {
      return;
    }
    this.router.navigate(['/demande-devis']);
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

  async payNow(): Promise<void> {
    if (!this.hasItems()) {
      return;
    }

    // Vérifier que l'utilisateur est connecté
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.authUser();
    if (!user) {
      this.paymentMessage.set({ type: 'error', text: 'Utilisateur non trouvé. Veuillez vous reconnecter.' });
      setTimeout(() => this.paymentMessage.set(null), 5000);
      return;
    }

    // Collecter les informations nécessaires via des prompts (à améliorer avec un formulaire)
    const addressIdStr = prompt('Veuillez entrer l\'ID de votre adresse de livraison:');
    if (!addressIdStr) {
      return;
    }

    const addressId = parseInt(addressIdStr, 10);
    if (isNaN(addressId)) {
      this.paymentMessage.set({ type: 'error', text: 'ID d\'adresse invalide' });
      setTimeout(() => this.paymentMessage.set(null), 5000);
      return;
    }

    const zone = prompt('Veuillez entrer votre zone de livraison (ex: Bamako-Centre):') || 'Bamako-Centre';
    const promoCode = this.promoCode() || null;

    this.isProcessingPayment.set(true);
    this.paymentMessage.set(null);

    try {
      // Étape 1: Créer la commande et la facture Paydunya
      const createPaymentRequest = {
        addressId,
        zone,
        promoCode
      };

      const paymentResponse = await firstValueFrom(
        this.paymentService.createPayment(createPaymentRequest)
      );

      if (!paymentResponse.success || !paymentResponse.invoiceToken) {
        throw new Error(paymentResponse.message || 'Échec de la création de la facture');
      }

      // Étape 2: Collecter les informations du compte de test Paydunya SoftPay
      const testEmail = prompt('Email du compte de test Paydunya:') || '[email protected]';
      const testPhone = prompt('Numéro de téléphone du compte de test (ex: 97403627):') || '97403627';
      const testPassword = prompt('Mot de passe du compte de test:') || 'Miliey@2121';

      if (!testEmail || !testPhone || !testPassword) {
        this.paymentMessage.set({ type: 'error', text: 'Informations du compte de test requises pour effectuer le paiement' });
        setTimeout(() => this.paymentMessage.set(null), 5000);
        this.isProcessingPayment.set(false);
        return;
      }

      // Étape 3: Effectuer le paiement SoftPay
      const makePaymentRequest = {
        phoneNumber: testPhone,
        customerEmail: testEmail,
        password: testPassword,
        invoiceToken: paymentResponse.invoiceToken
      };

      const makePaymentResponse = await firstValueFrom(
        this.paymentService.makePayment(makePaymentRequest)
      );

      if (makePaymentResponse.success) {
        this.paymentMessage.set({ type: 'success', text: 'Paiement effectué avec succès !' });
        // Vider le panier après un paiement réussi
        setTimeout(() => {
          this.cartService.clear();
          this.paymentMessage.set(null);
          this.router.navigate(['/orders']);
        }, 2000);
      } else {
        this.paymentMessage.set({ 
          type: 'error', 
          text: makePaymentResponse.message || 'Échec du paiement. Veuillez réessayer.' 
        });
        setTimeout(() => this.paymentMessage.set(null), 5000);
      }

    } catch (error: any) {
      console.error('Erreur lors du paiement:', error);
      const errorMessage = error.error?.error || error.error?.message || error.message || 'Erreur lors du paiement';
      this.paymentMessage.set({ type: 'error', text: errorMessage });
      setTimeout(() => this.paymentMessage.set(null), 5000);
    } finally {
      this.isProcessingPayment.set(false);
    }
  }
}

