export type QuoteStatus =
  | 'EN_ATTENTE'
  | 'DEVIS_EN_PREPARATION'
  | 'DEVIS_ENVOYE'
  | 'EN_ATTENTE_VALIDATION'
  | 'VALIDE_PAR_CLIENT'
  | 'EN_COURS_LIVRAISON'
  | 'TERMINE'
  | 'ANNULE';

export interface QuoteItem {
  id: number;
  productId: number | null;
  productName: string;
  brand: string | null;
  width: number | null;
  profile: number | null;
  diameter: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface QuoteResponse {
  id: number;
  requestNumber: string;
  quoteNumber: string | null;
  status: QuoteStatus;
  subtotalRequested: number;
  discountTotal: number | null;
  totalQuoted: number | null;
  validUntil: string | null;
  quotePdfUrl: string | null;
  validatedAt: string | null;
  validatedIp: string | null;
  clientEmail: string;
  clientName: string;
  clientMessage: string | null;
  adminNotes: string | null;
  deliveryDetails: string | null;
  assignedLivreur: string | null;
  updatedAt: string | null;
  items: QuoteItem[];
}

