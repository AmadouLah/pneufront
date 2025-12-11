import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environment';
import { QuoteResponse } from '../shared/types/quote';

export interface DeliveryDto {
  id: number;
  trackingNumber: string | null;
  status: string;
  zone: string | null;
  shippingFee: number | null;
  assignedAt: string | null;
  deliveredAt: string | null;
  orderNumber?: string | null;
}

@Injectable({ providedIn: 'root' })
export class LivreurService {
  private readonly http = inject(HttpClient);
  private readonly baseQuotes = `${environment.apiUrl}/livreur/quotes`;
  private readonly baseDeliveries = `${environment.apiUrl}/livreur/deliveries`;

  getAssignedQuotes() {
    return this.http.get<QuoteResponse[]>(this.baseQuotes);
  }

  completeQuote(id: number, payload: {
    latitude: number;
    longitude: number;
    photoBase64?: string;
    signatureData?: string;
    deliveryNotes?: string;
  }) {
    return this.http.post<QuoteResponse>(`${this.baseQuotes}/${id}/complete`, payload);
  }

  markClientAbsent(id: number, payload: {
    photoBase64?: string;
    notes?: string;
  }) {
    return this.http.post<QuoteResponse>(`${this.baseQuotes}/${id}/client-absent`, payload);
  }

  getAssignedDeliveries() {
    return this.http.get<DeliveryDto[]>(this.baseDeliveries);
  }

  completeDelivery(id: number) {
    return this.http.post<DeliveryDto>(`${this.baseDeliveries}/${id}/complete`, {});
  }
}

