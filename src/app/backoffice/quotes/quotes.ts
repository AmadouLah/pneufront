import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { AdminQuoteService, QuoteAdminItemPayload, QuoteAdminUpdatePayload } from '../../services/admin-quote.service';
import { QuoteItem, QuoteResponse, QuoteStatus } from '../../shared/types/quote';
import { environment } from '../../environment';
import { formatCurrency } from '../../shared/utils/currency';

interface LivreurOption {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-admin-quotes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxExtendedPdfViewerModule],
  templateUrl: './quotes.html',
  styleUrls: ['./quotes.css']
})
export class QuotesComponent implements OnInit {
  private readonly adminQuoteService = inject(AdminQuoteService);
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  @ViewChild('detailPanel') private detailPanel?: ElementRef<HTMLDivElement>;

  private readonly workflowOrder: QuoteStatus[] = [
    'EN_ATTENTE',
    'DEVIS_EN_PREPARATION',
    'DEVIS_ENVOYE',
    'EN_ATTENTE_VALIDATION',
    'VALIDE_PAR_CLIENT',
    'EN_COURS_LIVRAISON',
    'TERMINE'
  ];

  readonly workflowSteps = [
    {
      status: 'EN_ATTENTE' as QuoteStatus,
      title: 'Réception',
      description: 'Demande reçue et en attente de traitement.'
    },
    {
      status: 'DEVIS_EN_PREPARATION' as QuoteStatus,
      title: 'Préparation',
      description: 'Ajustez les prix, ajoutez les notes et préparez le PDF.'
    },
    {
      status: 'DEVIS_ENVOYE' as QuoteStatus,
      title: 'Envoi',
      description: 'Le devis est envoyé au client par e-mail.'
    },
    {
      status: 'EN_ATTENTE_VALIDATION' as QuoteStatus,
      title: 'Validation client',
      description: 'Le client doit valider et signer électroniquement.'
    },
    {
      status: 'VALIDE_PAR_CLIENT' as QuoteStatus,
      title: 'Validé',
      description: 'Le client a validé, préparez la livraison.'
    },
    {
      status: 'EN_COURS_LIVRAISON' as QuoteStatus,
      title: 'Livraison',
      description: 'Le livreur est assigné et la livraison est en cours.'
    },
    {
      status: 'TERMINE' as QuoteStatus,
      title: 'Terminé',
      description: 'Livraison confirmée, dossier clôturé.'
    }
  ];

  readonly quotes = signal<QuoteResponse[]>([]);
  readonly isLoadingList = signal(false);
  readonly listError = signal('');

  readonly selectedQuote = signal<QuoteResponse | null>(null);
  readonly editableItems = signal<QuoteItem[]>([]);
  readonly livreurs = signal<LivreurOption[]>([]);

  readonly statusOptions: QuoteStatus[] = [
    'EN_ATTENTE',
    'DEVIS_EN_PREPARATION',
    'DEVIS_ENVOYE',
    'EN_ATTENTE_VALIDATION',
    'VALIDE_PAR_CLIENT',
    'EN_COURS_LIVRAISON',
    'TERMINE'
  ];

  readonly isProcessing = signal(false);
  readonly isSendingQuote = signal(false);
  readonly feedback = signal<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  readonly isPdfLoading = signal(false);
  readonly pdfError = signal('');

  readonly filtersForm = this.fb.group({
    statuses: this.fb.control<QuoteStatus[]>([])
  });

  readonly settingsForm = this.fb.group({
    validUntil: [''],
    discountType: ['amount' as 'amount' | 'percentage'],
    discountValue: [0],
    adminNotes: [''],
    deliveryDetails: [''],
    livreurId: [null as number | null]
  });

  ngOnInit(): void {
    this.loadQuotes();
  }

  getTotal(): number {
    const itemsTotal = this.editableItems()
      .map((item) => item.unitPrice * item.quantity)
      .reduce((sum, value) => sum + value, 0);
    const discount = this.calculateDiscount(itemsTotal);
    return Math.max(0, itemsTotal - discount);
  }

  calculateDiscount(subtotal: number): number {
    const discountType = this.settingsForm.value.discountType ?? 'amount';
    const discountValue = Number(this.settingsForm.value.discountValue ?? 0);
    
    if (discountValue <= 0) {
      return 0;
    }
    
    if (discountType === 'percentage') {
      const percentageDiscount = (subtotal * discountValue) / 100;
      return Math.min(percentageDiscount, subtotal);
    }
    
    return Math.min(discountValue, subtotal);
  }

  getDiscountDisplay(): string {
    const discountType = this.settingsForm.value.discountType ?? 'amount';
    const discountValue = Number(this.settingsForm.value.discountValue ?? 0);
    
    if (discountValue <= 0) {
      return '0 FCFA';
    }
    
    const subtotal = this.editableItems()
      .map((item) => item.unitPrice * item.quantity)
      .reduce((sum, value) => sum + value, 0);
    
    const discount = this.calculateDiscount(subtotal);
    return this.formatPrice(discount);
  }

  getDiscountMax(): number | null {
    return this.settingsForm.value.discountType === 'percentage' ? 100 : null;
  }

  hasDiscount(): boolean {
    const discountValue = Number(this.settingsForm.value.discountValue ?? 0);
    return discountValue > 0;
  }

  loadQuotes(): void {
    this.isLoadingList.set(true);
    this.listError.set('');

    const statuses = this.filtersForm.value.statuses ?? [];
    this.adminQuoteService.listQuotes(statuses).subscribe({
      next: (quotes) => {
        this.quotes.set(quotes);
        this.isLoadingList.set(false);
      },
      error: () => {
        this.listError.set('Impossible de charger les demandes de devis.');
        this.isLoadingList.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadQuotes();
  }

  onStatusToggle(status: QuoteStatus, checked: boolean | undefined): void {
    const current = new Set(this.filtersForm.value.statuses ?? []);
    if (checked) {
      current.add(status);
    } else {
      current.delete(status);
    }
    this.filtersForm.patchValue({ statuses: Array.from(current) as QuoteStatus[] });
  }

  selectQuote(quote: QuoteResponse): void {
    this.adminQuoteService.getQuote(quote.id).subscribe({
      next: (full) => {
        this.selectedQuote.set(full);
        this.editableItems.set(full.items.map((item) => ({ ...item })));
        const discountTotal = full.discountTotal ?? 0;
        const subtotal = full.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        
        let discountType: 'amount' | 'percentage' = 'amount';
        let discountValue = discountTotal;
        
        if (subtotal > 0 && discountTotal > 0) {
          const percentage = (discountTotal / subtotal) * 100;
          const roundedPercentage = Math.round(percentage * 100) / 100;
          const calculatedAmount = (subtotal * roundedPercentage) / 100;
          const difference = Math.abs(discountTotal - calculatedAmount);
          
          if (percentage <= 100 && difference < 0.01) {
            discountType = 'percentage';
            discountValue = roundedPercentage;
          }
        }
        
        this.settingsForm.patchValue({
          validUntil: full.validUntil ?? '',
          discountType: discountType as 'amount' | 'percentage',
          discountValue: discountValue,
          adminNotes: full.adminNotes ?? '',
          deliveryDetails: full.deliveryDetails ?? '',
          livreurId: null
        });
        
        if (full.assignedLivreur && full.livreurAssignmentEmailSent) {
          this.settingsForm.get('livreurId')?.disable();
        } else {
          this.settingsForm.get('livreurId')?.enable();
        }
        this.feedback.set(null);
        this.loadLivreurs();
        this.fetchQuotePreview(full.id);
        queueMicrotask(() => this.scrollDetailIntoView());
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de charger le devis sélectionné.' });
      }
    });
  }

  updateItem(index: number, field: 'quantity' | 'unitPrice', value: string): void {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      const items = [...this.editableItems()];
      items[index] = { ...items[index], [field]: parsed };
      items[index].lineTotal = items[index].unitPrice * items[index].quantity;
      this.editableItems.set(items);
    }
  }

  saveDraft(): void {
    const quote = this.selectedQuote();
    if (!quote) {
      return;
    }
    this.isProcessing.set(true);
    const payload = this.buildPayload();
    this.adminQuoteService.updateQuote(quote.id, payload).subscribe({
      next: (updated) => {
        this.selectedQuote.set(updated);
        this.feedback.set({ type: 'success', message: 'Brouillon enregistré.' });
        this.isProcessing.set(false);
        this.loadQuotes();
      },
      error: (error) => {
        const message = error?.error?.error || 'Impossible d\'enregistrer le brouillon.';
        this.feedback.set({ type: 'error', message });
        this.isProcessing.set(false);
      }
    });
  }

  sendQuote(): void {
    const quote = this.selectedQuote();
    if (!quote || this.isSendingQuote()) {
      return;
    }

    if (quote.status === 'DEVIS_ENVOYE' || quote.status === 'EN_ATTENTE_VALIDATION') {
      this.feedback.set({ 
        type: 'error', 
        message: 'Ce devis a déjà été envoyé au client.' 
      });
      return;
    }

    this.isSendingQuote.set(true);
    this.isProcessing.set(true);
    this.feedback.set(null);
    
    const payload = this.buildPayload();
    const frontendUrl = typeof window !== 'undefined' ? `${window.location.origin}/mon-compte/devis` : undefined;
    
    this.adminQuoteService.sendQuote(quote.id, payload, frontendUrl).subscribe({
      next: (updated) => {
        this.selectedQuote.set(updated);
        this.feedback.set({ 
          type: 'success', 
          message: 'Devis envoyé au client avec succès !' 
        });
        this.isSendingQuote.set(false);
        this.isProcessing.set(false);
        this.loadQuotes();
      },
      error: (error) => {
        const message = error?.error?.error || 'Impossible d\'envoyer le devis.';
        this.feedback.set({ type: 'error', message });
        this.isSendingQuote.set(false);
        this.isProcessing.set(false);
      }
    });
  }

  assignLivreur(): void {
    const quote = this.selectedQuote();
    const livreurId = this.settingsForm.value.livreurId;
    
    if (!quote) {
      return;
    }
    
    if (quote.assignedLivreur && quote.livreurAssignmentEmailSent) {
      this.feedback.set({ 
        type: 'error', 
        message: 'Ce devis est déjà assigné à un livreur et l\'email a été envoyé avec succès. La réassignation n\'est pas autorisée.' 
      });
      return;
    }
    
    if (!livreurId) {
      this.feedback.set({ type: 'error', message: 'Veuillez sélectionner un livreur.' });
      return;
    }
    
    this.isProcessing.set(true);
    this.adminQuoteService.assignLivreur(quote.id, livreurId, this.settingsForm.value.deliveryDetails ?? undefined)
      .subscribe({
        next: (updated) => {
          this.selectedQuote.set(updated);
          if (updated.livreurAssignmentEmailSent) {
            this.settingsForm.get('livreurId')?.disable();
            this.feedback.set({ type: 'success', message: 'Livreur assigné et email envoyé avec succès.' });
          } else {
            this.feedback.set({ 
              type: 'warning', 
              message: 'Livreur assigné mais l\'email n\'a pas pu être envoyé. Vous pouvez réassigner si nécessaire.' 
            });
          }
          this.isProcessing.set(false);
          this.loadQuotes();
        },
        error: (error) => {
          const message = error?.error?.error || 'Impossible d\'assigner le livreur.';
          this.feedback.set({ type: 'error', message });
          this.isProcessing.set(false);
        }
      });
  }

  isLivreurAssigned(): boolean {
    const quote = this.selectedQuote();
    return !!quote?.assignedLivreur && !!quote?.livreurAssignmentEmailSent;
  }

  formatPrice(value: number): string {
    return formatCurrency(value);
  }

  resetSelection(): void {
    const current = this.selectedQuote();
    if (current?.quotePdfUrl && current.quotePdfUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(current.quotePdfUrl);
    }
    this.selectedQuote.set(null);
    this.editableItems.set([]);
    this.settingsForm.reset();
    this.settingsForm.get('livreurId')?.enable();
    this.feedback.set(null);
    this.isPdfLoading.set(false);
    this.pdfError.set('');
    this.isSendingQuote.set(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private buildPayload(): QuoteAdminUpdatePayload {
    const items: QuoteAdminItemPayload[] = this.editableItems().map((item) => ({
      productId: item.productId,
      productName: item.productName,
      brand: item.brand,
      width: item.width,
      profile: item.profile,
      diameter: item.diameter,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    const validUntil = this.settingsForm.value.validUntil;
    const itemsTotal = this.editableItems()
      .map((item) => item.unitPrice * item.quantity)
      .reduce((sum, value) => sum + value, 0);
    const discountTotal = this.calculateDiscount(itemsTotal);

    return {
      items,
      discountTotal,
      totalQuoted: this.getTotal(),
      validUntil: validUntil && validUntil.length > 0 ? validUntil : null,
      adminNotes: this.settingsForm.value.adminNotes ?? null,
      deliveryDetails: this.settingsForm.value.deliveryDetails ?? null
    };
  }

  private loadLivreurs(): void {
    const url = `${environment.apiUrl}/admin/users/role/LIVREUR`;
    this.http.get<any[]>(url).subscribe({
      next: (users) => {
        if (!users || users.length === 0) {
          console.warn('Aucun livreur trouvé dans la base de données');
          this.livreurs.set([]);
          return;
        }
        const options = users.map((user) => {
          const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
          return {
            id: user.id,
            name: fullName || user.email || `Livreur #${user.id}`,
            email: user.email || 'Email non disponible'
          };
        });
        console.debug(`Chargement de ${options.length} livreur(s)`, options);
        this.livreurs.set(options);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des livreurs:', error);
        this.livreurs.set([]);
        this.feedback.set({ 
          type: 'error', 
          message: 'Impossible de charger la liste des livreurs.' 
        });
      }
    });
  }

  private scrollDetailIntoView(): void {
    if (!this.detailPanel) {
      return;
    }
    const element = this.detailPanel.nativeElement;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  stepState(step: QuoteStatus): 'done' | 'active' | 'upcoming' {
    const current = this.selectedQuote()?.status ?? null;
    if (!current) {
      return 'upcoming';
    }
    const currentIndex = this.workflowOrder.indexOf(current);
    const stepIndex = this.workflowOrder.indexOf(step);
    if (stepIndex === -1 || currentIndex === -1) {
      return 'upcoming';
    }
    if (stepIndex < currentIndex) {
      return 'done';
    }
    if (stepIndex === currentIndex) {
      return 'active';
    }
    return 'upcoming';
  }

  refreshPreview(): void {
    const quote = this.selectedQuote();
    if (!quote || this.isPdfLoading()) {
      return;
    }
    this.fetchQuotePreview(quote.id);
  }

  private fetchQuotePreview(id: number): void {
    this.isPdfLoading.set(true);
    this.pdfError.set('');
    
    const quote = this.selectedQuote();
    if (!quote) {
      this.isPdfLoading.set(false);
      return;
    }

    const pdfUrl = this.adminQuoteService.getPreviewPdfUrl(id);
    this.http.get(pdfUrl, { 
      responseType: 'blob',
      observe: 'response',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }).subscribe({
      next: (response) => {
        if (!response.body || response.body.size === 0) {
          this.pdfError.set('Le PDF généré est vide.');
          this.isPdfLoading.set(false);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/pdf')) {
          console.error('Type de contenu inattendu:', contentType);
          this.pdfError.set('Le serveur n\'a pas retourné un PDF valide.');
          this.isPdfLoading.set(false);
          return;
        }

        const blob = new Blob([response.body!], { type: 'application/pdf' });
        if (blob.size === 0) {
          this.pdfError.set('Le blob créé est vide.');
          this.isPdfLoading.set(false);
          return;
        }

        const url = window.URL.createObjectURL(blob);
        
        this.selectedQuote.update((current) => {
          if (!current) {
            return current;
          }
          if (current.quotePdfUrl && current.quotePdfUrl.startsWith('blob:')) {
            window.URL.revokeObjectURL(current.quotePdfUrl);
          }
          return { ...current, quotePdfUrl: url };
        });
        
        this.isPdfLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du PDF:', error);
        let message = 'Impossible de charger le PDF du devis.';
        if (error?.error instanceof Blob) {
          error.error.text().then((text: string) => {
            try {
              const json = JSON.parse(text);
              message = json.message || json.error || message;
            } catch {
              message = text || message;
            }
            this.pdfError.set(message);
            this.isPdfLoading.set(false);
          });
        } else {
          message = error?.error?.message || error?.message || message;
          this.pdfError.set(message);
          this.isPdfLoading.set(false);
        }
      }
    });
  }
}

