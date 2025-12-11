import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';
import { QuoteResponse } from '../shared/types/quote';

interface QuoteRequestPayload {
  message?: string;
  items: QuoteRequestItemPayload[];
}

interface QuoteRequestItemPayload {
  productId: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);

  submitQuoteRequest(payload: QuoteRequestPayload) {
    return this.http.post<QuoteResponse>(`${environment.apiUrl}/quotes/request`, payload);
  }

  getMyQuotes() {
    return this.http.get<QuoteResponse[]>(`${environment.apiUrl}/quotes`);
  }

  getQuoteById(id: number) {
    return this.http.get<QuoteResponse>(`${environment.apiUrl}/quotes/${id}`);
  }

  validateQuote(id: number, requestedDeliveryDate?: string) {
    const deviceInfo = typeof navigator !== 'undefined' 
      ? `${navigator.userAgent} - ${navigator.platform}`
      : 'Unknown device';
    return this.http.post<QuoteResponse>(`${environment.apiUrl}/quotes/${id}/validate`, {
      requestedDeliveryDate: requestedDeliveryDate || null,
      deviceInfo: deviceInfo
    });
  }

  confirmDelivery(id: number) {
    return this.http.post<QuoteResponse>(`${environment.apiUrl}/quotes/${id}/confirm-delivery`, {});
  }
}

