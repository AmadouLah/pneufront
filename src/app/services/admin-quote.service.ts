import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environment';
import { QuoteResponse, QuoteStatus } from '../shared/types/quote';

export interface QuoteAdminItemPayload {
  productId: number | null;
  productName: string;
  brand: string | null;
  width: number | null;
  profile: number | null;
  diameter: number | null;
  quantity: number;
  unitPrice: number;
}

export interface QuoteAdminUpdatePayload {
  items: QuoteAdminItemPayload[];
  discountTotal: number | null;
  totalQuoted: number | null;
  validUntil: string | null;
  adminNotes: string | null;
  deliveryDetails: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminQuoteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/quotes`;

  listQuotes(statuses: QuoteStatus[] = []) {
    let params = new HttpParams();
    statuses.forEach((status) => {
      params = params.append('status', status);
    });
    return this.http.get<QuoteResponse[]>(this.baseUrl, { params });
  }

  getQuote(id: number) {
    return this.http.get<QuoteResponse>(`${this.baseUrl}/${id}`);
  }

  updateQuote(id: number, payload: QuoteAdminUpdatePayload) {
    return this.http.put<QuoteResponse>(`${this.baseUrl}/${id}`, payload);
  }

  sendQuote(id: number, payload: QuoteAdminUpdatePayload, quoteUrl?: string) {
    const params = quoteUrl ? { params: new HttpParams().set('quoteUrl', quoteUrl) } : {};
    return this.http.post<QuoteResponse>(`${this.baseUrl}/${id}/send`, payload, params);
  }

  assignLivreur(id: number, livreurId: number, deliveryDetails?: string) {
    return this.http.post<QuoteResponse>(`${this.baseUrl}/${id}/assign-livreur`, {
      livreurId,
      deliveryDetails
    });
  }

  generatePreview(id: number) {
    return this.http.post<QuoteResponse>(`${this.baseUrl}/${id}/preview`, {});
  }
}

