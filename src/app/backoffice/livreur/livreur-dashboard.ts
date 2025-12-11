import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LivreurService, DeliveryDto } from '../../services/livreur.service';
import { QuoteResponse } from '../../shared/types/quote';
import { formatCurrency } from '../../shared/utils/currency';
import { DeliveryProofService } from '../../shared/services/delivery-proof.service';

@Component({
  selector: 'app-livreur-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './livreur-dashboard.html',
  styleUrls: ['./livreur-dashboard.css']
})
export class LivreurDashboardComponent implements OnInit, AfterViewInit {
  private readonly livreurService = inject(LivreurService);
  private readonly deliveryProofService = inject(DeliveryProofService);

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;

  readonly quotes = signal<QuoteResponse[]>([]);
  readonly deliveries = signal<DeliveryDto[]>([]);

  readonly loadingQuotes = signal(false);
  readonly loadingDeliveries = signal(false);
  readonly feedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  readonly showDeliveryModal = signal(false);
  readonly showAbsentModal = signal(false);
  readonly selectedQuote = signal<QuoteResponse | null>(null);
  readonly isProcessing = signal(false);

  readonly location = signal<{ latitude: number; longitude: number } | null>(null);
  readonly photoPreview = signal<string | null>(null);
  readonly signatureData = signal<string | null>(null);
  readonly deliveryNotes = signal('');
  readonly absentNotes = signal('');
  readonly absentPhotoPreview = signal<string | null>(null);

  private isDrawing = false;

  ngOnInit(): void {
    this.loadQuotes();
    this.loadDeliveries();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initSignatureCanvas(), 100);
  }

  filteredQuotes(): QuoteResponse[] {
    return this.quotes().filter(q => 
      q.status === 'EN_COURS_LIVRAISON' || q.status === 'CLIENT_ABSENT'
    );
  }

  loadQuotes(): void {
    this.loadingQuotes.set(true);
    this.livreurService.getAssignedQuotes().subscribe({
      next: (quotes) => {
        this.quotes.set(quotes);
        this.loadingQuotes.set(false);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de charger les devis assignés.' });
        this.loadingQuotes.set(false);
      }
    });
  }

  loadDeliveries(): void {
    this.loadingDeliveries.set(true);
    this.livreurService.getAssignedDeliveries().subscribe({
      next: (deliveries) => {
        this.deliveries.set(deliveries);
        this.loadingDeliveries.set(false);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de charger les livraisons.' });
        this.loadingDeliveries.set(false);
      }
    });
  }

  openDeliveryModal(quote: QuoteResponse): void {
    this.selectedQuote.set(quote);
    this.resetDeliveryForm();
    this.showDeliveryModal.set(true);
    this.captureLocation();
  }

  openAbsentModal(quote: QuoteResponse): void {
    this.selectedQuote.set(quote);
    this.resetAbsentForm();
    this.showAbsentModal.set(true);
  }

  closeDeliveryModal(): void {
    this.showDeliveryModal.set(false);
    this.resetDeliveryForm();
  }

  closeAbsentModal(): void {
    this.showAbsentModal.set(false);
    this.resetAbsentForm();
  }

  private resetDeliveryForm(): void {
    this.location.set(null);
    this.photoPreview.set(null);
    this.signatureData.set(null);
    this.deliveryNotes.set('');
    this.clearSignature();
  }

  private resetAbsentForm(): void {
    this.absentPhotoPreview.set(null);
    this.absentNotes.set('');
  }

  private async captureLocation(): Promise<void> {
    try {
      const coords = await this.deliveryProofService.getCurrentLocation();
      this.location.set(coords);
    } catch (error) {
      this.feedback.set({ 
        type: 'error', 
        message: 'Impossible d\'obtenir la géolocalisation. Veuillez activer la géolocalisation.' 
      });
    }
  }

  async capturePhoto(): Promise<void> {
    try {
      const photoBase64 = await this.deliveryProofService.capturePhotoFromCamera();
      this.photoPreview.set(photoBase64);
    } catch (error) {
      this.feedback.set({ type: 'error', message: 'Erreur lors de la capture de la photo.' });
    }
  }

  async captureAbsentPhoto(): Promise<void> {
    try {
      const photoBase64 = await this.deliveryProofService.capturePhotoFromCamera();
      this.absentPhotoPreview.set(photoBase64);
    } catch (error) {
      this.feedback.set({ type: 'error', message: 'Erreur lors de la capture de la photo.' });
    }
  }

  initSignatureCanvas(): void {
    if (!this.signatureCanvas?.nativeElement) return;
    const canvas = this.signatureCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  onSignatureStart(event: MouseEvent | TouchEvent): void {
    this.isDrawing = true;
    this.drawSignature(event);
  }

  onSignatureMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawing) return;
    event.preventDefault();
    this.drawSignature(event);
  }

  onSignatureEnd(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveSignature();
    }
  }

  private drawSignature(event: MouseEvent | TouchEvent): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event as TouchEvent).touches 
      ? (event as TouchEvent).touches[0].clientX - rect.left
      : (event as MouseEvent).clientX - rect.left;
    const y = (event as TouchEvent).touches
      ? (event as TouchEvent).touches[0].clientY - rect.top
      : (event as MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  private saveSignature(): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    this.signatureData.set(canvas.toDataURL());
  }

  clearSignature(): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.signatureData.set(null);
  }

  completeQuote(): void {
    const quote = this.selectedQuote();
    if (!quote || this.isProcessing()) return;

    if (!this.location()) {
      this.feedback.set({ type: 'error', message: 'La géolocalisation est requise pour confirmer la livraison.' });
      return;
    }

    if (!this.photoPreview()) {
      this.feedback.set({ type: 'error', message: 'Une photo de preuve est requise.' });
      return;
    }

    if (!this.signatureData()) {
      this.feedback.set({ type: 'error', message: 'La signature du client est requise.' });
      return;
    }

    this.isProcessing.set(true);
    const loc = this.location()!;

    this.livreurService.completeQuote(quote.id, {
      latitude: loc.latitude,
      longitude: loc.longitude,
      photoBase64: this.photoPreview()!,
      signatureData: this.signatureData()!,
      deliveryNotes: this.deliveryNotes() || undefined
    }).subscribe({
      next: () => {
        this.feedback.set({ type: 'success', message: 'Livraison confirmée avec succès.' });
        this.closeDeliveryModal();
        this.loadQuotes();
        this.isProcessing.set(false);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de confirmer la livraison.' });
        this.isProcessing.set(false);
      }
    });
  }

  markClientAbsent(): void {
    const quote = this.selectedQuote();
    if (!quote || this.isProcessing()) return;

    this.isProcessing.set(true);

    this.livreurService.markClientAbsent(quote.id, {
      photoBase64: this.absentPhotoPreview() || undefined,
      notes: this.absentNotes() || undefined
    }).subscribe({
      next: () => {
        this.feedback.set({ type: 'success', message: 'Client absent enregistré.' });
        this.closeAbsentModal();
        this.loadQuotes();
        this.isProcessing.set(false);
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible d\'enregistrer l\'absence du client.' });
        this.isProcessing.set(false);
      }
    });
  }

  completeDelivery(delivery: DeliveryDto): void {
    this.livreurService.completeDelivery(delivery.id).subscribe({
      next: () => {
        this.feedback.set({ type: 'success', message: 'Livraison terminée.' });
        this.loadDeliveries();
      },
      error: () => {
        this.feedback.set({ type: 'error', message: 'Impossible de terminer la livraison.' });
      }
    });
  }

  formatPrice(value: number | null | undefined): string {
    if (typeof value !== 'number') {
      return '-';
    }
    return formatCurrency(value);
  }
}

