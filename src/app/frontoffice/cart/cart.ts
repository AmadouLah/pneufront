import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { CartService } from '../../services/cart.service';
import { PaymentService } from '../../services/payment.service';
import { Authservice } from '../../services/authservice';
import { CartItem } from '../../shared/types/cart';
import { formatCurrency } from '../../shared/utils/currency';
import { environment } from '../../environment';
import { firstValueFrom } from 'rxjs';

interface Address {
  id: number;
  street: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  phoneNumber?: string;
  default: boolean;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, HeaderComponent, FooterComponent],
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
  
  showPaymentModal = signal(false);
  addresses = signal<Address[]>([]);
  isLoadingAddresses = signal(false);
  paymentForm: FormGroup;

  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly authService = inject(Authservice);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  constructor(private readonly cartService: CartService) {
    this.paymentForm = this.fb.group({
      addressId: [null, [Validators.required]],
      zone: ['Bamako-Centre', [Validators.required, Validators.minLength(3)]],
      testEmail: ['[email protected]', [Validators.required, Validators.email]],
      testPhone: ['97403627', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      testPassword: ['Miliey@2121', [Validators.required, Validators.minLength(6)]]
    });
  }

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

  openPaymentModal(): void {
    if (!this.hasItems()) {
      return;
    }

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

    this.loadAddresses();
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.paymentForm.reset({
      zone: 'Bamako-Centre',
      testEmail: '[email protected]',
      testPhone: '97403627',
      testPassword: 'Miliey@2121'
    });
    this.paymentMessage.set(null);
  }

  loadAddresses(): void {
    this.isLoadingAddresses.set(true);
    this.http.get<Address[]>(`${environment.apiUrl}/addresses`).subscribe({
      next: (addresses) => {
        this.addresses.set(addresses || []);
        if (addresses.length > 0) {
          const defaultAddress = addresses.find(a => a.default) || addresses[0];
          this.paymentForm.patchValue({ addressId: defaultAddress.id });
        }
        this.isLoadingAddresses.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des adresses:', error);
        this.paymentMessage.set({ 
          type: 'error', 
          text: 'Impossible de charger vos adresses. Veuillez réessayer.' 
        });
        this.isLoadingAddresses.set(false);
      }
    });
  }

  async submitPayment(): Promise<void> {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    if (this.items().length === 0) {
      this.paymentMessage.set({ type: 'error', text: 'Votre panier est vide' });
      return;
    }

    const formValue = this.paymentForm.value;
    const promoCode = this.promoCode() || null;

    // Construire la map des items du panier
    const cartItems: Record<number, number> = {};
    this.items().forEach(item => {
      cartItems[item.productId] = item.quantity;
    });

    this.isProcessingPayment.set(true);
    this.paymentMessage.set(null);

    try {
      // Étape 1: Créer la commande et la facture Paydunya
      const createPaymentRequest = {
        addressId: formValue.addressId,
        zone: formValue.zone,
        promoCode,
        cartItems
      };

      const paymentResponse = await firstValueFrom(
        this.paymentService.createPayment(createPaymentRequest)
      );

      if (!paymentResponse.success || !paymentResponse.invoiceToken) {
        throw new Error(paymentResponse.message || 'Échec de la création de la facture');
      }

      // Étape 2: Effectuer le paiement SoftPay
      const makePaymentRequest = {
        phoneNumber: formValue.testPhone,
        customerEmail: formValue.testEmail,
        password: formValue.testPassword,
        invoiceToken: paymentResponse.invoiceToken
      };

      const makePaymentResponse = await firstValueFrom(
        this.paymentService.makePayment(makePaymentRequest)
      );

      if (makePaymentResponse.success) {
        this.paymentMessage.set({ type: 'success', text: 'Paiement effectué avec succès !' });
        this.closePaymentModal();
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
      }

    } catch (error: any) {
      console.error('Erreur lors du paiement:', error);
      const errorMessage = error.error?.error || error.error?.message || error.message || 'Erreur lors du paiement';
      this.paymentMessage.set({ type: 'error', text: errorMessage });
    } finally {
      this.isProcessingPayment.set(false);
    }
  }
}

