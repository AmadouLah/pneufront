import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Authservice } from '../../services/authservice';
import { UserRole } from '../../shared/types';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environement';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit, OnDestroy {
  private auth = inject(Authservice);
  private http = inject(HttpClient);
  sidebarOpen = false;
  isAdmin = false;
  private toggleListener: any;

  // Compteurs
  countLivres: number | null = null;
  countEmpruntsActifs: number | null = null;
  countReservationsActives: number | null = null;
  countUtilisateurs: number | null = null;
  countAbonnements: number | null = null;

  ngOnInit(): void {
    // Vérifier si l'utilisateur est un administrateur
    const user = this.auth.authUser();
    this.isAdmin = user?.role === UserRole.ADMIN;
    
    // Écouter les événements de toggle du sidebar
    this.toggleListener = (event: any) => {
      this.sidebarOpen = event.detail.open;
    };
    window.addEventListener('toggle-sidebar', this.toggleListener);

    // Charger les compteurs de façon paresseuse
    this.chargerCompteurs();
  }

  ngOnDestroy(): void {
    // Nettoyer l'écouteur d'événement
    if (this.toggleListener) {
      window.removeEventListener('toggle-sidebar', this.toggleListener);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  private async chargerCompteurs(): Promise<void> {
    try {
      const base = environment.apiUrl;
      const reqs = [
        this.http.get<number>(`${base}/livres/count`).toPromise(),
        this.http.get<number>(`${base}/bibliothecaire/emprunts/count/actifs`).toPromise(),
        this.http.get<any>(`${base}/reservations`, { params: { statut: 'ACTIVE', page: 0, size: 1 } }).toPromise(),
        this.http.get<any>(`${base}/admin/utilisateurs`, { params: { page: 0, size: 1 } }).toPromise(),
        this.http.get<any>(`${base}/abonnements`, { params: { page: 0, size: 1 } }).toPromise(),
      ];
      const [livres, empruntsActifs, reservationsActivesPage, utilisateursPage, abonnementsPage] = await Promise.all(reqs);
      this.countLivres = typeof livres === 'number' ? livres : null;
      this.countEmpruntsActifs = typeof empruntsActifs === 'number' ? empruntsActifs : null;
      this.countReservationsActives = Number(reservationsActivesPage?.totalElements ?? 0);
      this.countUtilisateurs = Number(utilisateursPage?.totalElements ?? 0);
      this.countAbonnements = Number(abonnementsPage?.totalElements ?? 0);
    } catch {
      // On ignore les erreurs pour ne pas casser le sidebar
    }
  }
}
