import { QuoteStatus } from '../types/quote';

export const QuoteStatusDisplay: Record<QuoteStatus, string> = {
  EN_ATTENTE: 'En attente',
  DEVIS_EN_PREPARATION: 'En préparation',
  DEVIS_ENVOYE: 'Devis envoyé',
  EN_ATTENTE_VALIDATION: 'En attente de validation',
  VALIDE_PAR_CLIENT: 'Validé',
  EN_COURS_LIVRAISON: 'En cours de livraison',
  LIVRE_EN_ATTENTE_CONFIRMATION: 'Livré - En attente',
  CLIENT_ABSENT: 'Client absent',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
} as const;

export type QuoteStatusColor = 'info' | 'warning' | 'success' | 'error' | 'neutral';

export const QuoteStatusColorMap: Record<QuoteStatus, QuoteStatusColor> = {
  EN_ATTENTE: 'info',
  DEVIS_EN_PREPARATION: 'warning',
  DEVIS_ENVOYE: 'info',
  EN_ATTENTE_VALIDATION: 'warning',
  VALIDE_PAR_CLIENT: 'success',
  EN_COURS_LIVRAISON: 'info',
  LIVRE_EN_ATTENTE_CONFIRMATION: 'success',
  CLIENT_ABSENT: 'warning',
  TERMINE: 'success',
  ANNULE: 'error',
} as const;

export function getQuoteStatusDisplay(status: QuoteStatus): string {
  return QuoteStatusDisplay[status] || status;
}

export function getQuoteStatusColor(status: QuoteStatus): QuoteStatusColor {
  return QuoteStatusColorMap[status] || 'neutral';
}

