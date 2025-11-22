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
  readonly feedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  readonly isPdfLoading = signal(false);
  readonly pdfError = signal('');

  readonly filtersForm = this.fb.group({
    statuses: this.fb.control<QuoteStatus[]>([])
  });

  readonly settingsForm = this.fb.group({
    validUntil: [''],
    discountTotal: [0],
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
    const discount = Number(this.settingsForm.value.discountTotal ?? 0);
    return Math.max(0, itemsTotal - discount);
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
        this.settingsForm.patchValue({
          validUntil: full.validUntil ?? '',
          discountTotal: full.discountTotal ?? 0,
          adminNotes: full.adminNotes ?? '',
          deliveryDetails: full.deliveryDetails ?? '',
          livreurId: null
        });
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
    if (!quote) {
      return;
    }
    this.isProcessing.set(true);
    const payload = this.buildPayload();
    const frontendUrl = typeof window !== 'undefined' ? `${window.location.origin}/mon-compte/devis` : undefined;
    this.adminQuoteService.sendQuote(quote.id, payload, frontendUrl).subscribe({
      next: (updated) => {
        this.selectedQuote.set(updated);
        this.feedback.set({ type: 'success', message: 'Devis envoyé au client.' });
        this.isProcessing.set(false);
        this.loadQuotes();
      },
      error: (error) => {
        const message = error?.error?.error || 'Impossible d\'envoyer le devis.';
        this.feedback.set({ type: 'error', message });
        this.isProcessing.set(false);
      }
    });
  }

  assignLivreur(): void {
    const quote = this.selectedQuote();
    const livreurId = this.settingsForm.value.livreurId;
    if (!quote || !livreurId) {
      this.feedback.set({ type: 'error', message: 'Veuillez sélectionner un livreur.' });
      return;
    }
    this.isProcessing.set(true);
    this.adminQuoteService.assignLivreur(quote.id, livreurId, this.settingsForm.value.deliveryDetails ?? undefined)
      .subscribe({
        next: (updated) => {
          this.selectedQuote.set(updated);
          this.feedback.set({ type: 'success', message: 'Livreur assigné et livraison lancée.' });
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

  formatPrice(value: number): string {
    return formatCurrency(value);
  }

  resetSelection(): void {
    this.selectedQuote.set(null);
    this.editableItems.set([]);
    this.settingsForm.reset();
    this.feedback.set(null);
    this.isPdfLoading.set(false);
    this.pdfError.set('');
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
    const discountTotal = Number(this.settingsForm.value.discountTotal ?? 0);

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
        const options = (users ?? []).map((user) => ({
          id: user.id,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email,
          email: user.email
        }));
        this.livreurs.set(options);
      },
      error: () => {
        this.livreurs.set([]);
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
    this.adminQuoteService.generatePreview(id).subscribe({
      next: (updated) => {
        this.selectedQuote.update((current) => {
          if (!current) {
            return updated;
          }
          return { ...current, quotePdfUrl: updated.quotePdfUrl };
        });
        this.isPdfLoading.set(false);
      },
      error: (error) => {
        const message = error?.error?.error || 'Impossible de générer le PDF via Carbone.';
        this.pdfError.set(message);
        this.isPdfLoading.set(false);
      }
    });
  }
}

