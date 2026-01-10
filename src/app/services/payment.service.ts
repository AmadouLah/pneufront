import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environment';

export interface CreatePaymentRequest {
  addressId: number;
  zone: string;
  promoCode?: string | null;
}

export interface PaymentResponse {
  invoiceToken: string;
  checkoutUrl: string;
  orderId: number;
  success: boolean;
  message: string;
}

export interface MakePaymentRequest {
  phoneNumber: string;
  customerEmail: string;
  password: string;
  invoiceToken: string;
}

export interface MakePaymentResponse {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  createPayment(request: CreatePaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.baseUrl}/create`, request);
  }

  makePayment(request: MakePaymentRequest): Observable<MakePaymentResponse> {
    return this.http.post<MakePaymentResponse>(`${this.baseUrl}/make-payment`, request);
  }
}
