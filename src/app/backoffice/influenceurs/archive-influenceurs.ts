import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { environment } from '../../environment';
import { Authservice } from '../../services/authservice';
import { FormHelperService } from '../../shared/services/form-helper.service';

interface Influenceur {
  id: number;
  commissionRate: number;
  archived: boolean;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
  };
}

@Component({
  selector: 'app-archive-influenceurs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './archive-influenceurs.html',
  styleUrls: ['./influenceurs.css']
})
export class ArchiveInfluenceursComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(Authservice);
  readonly formHelper = inject(FormHelperService);

  influenceurs = signal<Influenceur[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  actionLoadingId = signal<number | null>(null);
  actionType = signal<'restore' | 'delete' | null>(null);

  ngOnInit(): void {
    if (!this.isDeveloper()) {
      this.router.navigate(['/dashboard/influenceurs']);
      return;
    }
    this.loadArchivedInfluenceurs();
  }

  private loadArchivedInfluenceurs(): void {
    this.isLoading.set(true);
    this.http.get<Influenceur[]>(`${environment.apiUrl}/admin/influenceurs/archived`).subscribe({
      next: (influenceurs) => {
        this.influenceurs.set(influenceurs);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors du chargement des archives'));
        this.isLoading.set(false);
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  restoreInfluenceur(influenceur: Influenceur): void {
    this.actionLoadingId.set(influenceur.id);
    this.actionType.set('restore');
    this.errorMessage.set('');

    this.http.put<{ message?: string }>(`${environment.apiUrl}/admin/influenceurs/${influenceur.id}/restore`, null).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Influenceur restauré avec succès');
        this.loadArchivedInfluenceurs();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la restauration'));
        this.actionLoadingId.set(null);
        this.actionType.set(null);
        setTimeout(() => this.errorMessage.set(''), 5000);
      },
      complete: () => {
        this.actionLoadingId.set(null);
        this.actionType.set(null);
      }
    });
  }

  deleteInfluenceur(influenceur: Influenceur): void {
    if (!confirm('Supprimer définitivement cet influenceur ? Cette action est irréversible.')) {
      return;
    }

    this.actionLoadingId.set(influenceur.id);
    this.actionType.set('delete');
    this.errorMessage.set('');

    this.http.delete<{ message?: string }>(`${environment.apiUrl}/admin/influenceurs/${influenceur.id}`).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Influenceur supprimé définitivement');
        this.loadArchivedInfluenceurs();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Erreur lors de la suppression'));
        this.actionLoadingId.set(null);
        this.actionType.set(null);
        setTimeout(() => this.errorMessage.set(''), 5000);
      },
      complete: () => {
        this.actionLoadingId.set(null);
        this.actionType.set(null);
      }
    });
  }

  private isDeveloper(): boolean {
    return this.authService.authUser()?.role?.toUpperCase() === 'DEVELOPER';
  }
}

