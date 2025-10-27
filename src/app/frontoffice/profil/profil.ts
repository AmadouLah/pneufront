import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { Authservice } from '../../services/authservice';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './profil.html',
  styleUrls: ['./profil.css']
})
export class ProfilComponent implements OnInit {
  user = signal<any>(null);
  isLoading = signal(false);

  constructor(
    private authService: Authservice,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  /**
   * Charge les informations de l'utilisateur
   */
  private loadUserInfo(): void {
    const userInfo = this.authService.authUser();
    if (userInfo) {
      this.user.set(userInfo);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    this.isLoading.set(true);
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (refreshToken) {
      this.authService.logout(refreshToken).subscribe({
        next: () => {
          this.authService.clearAuthData();
          this.router.navigate(['/']);
        },
        error: () => {
          this.authService.clearAuthData();
          this.router.navigate(['/']);
        }
      });
    } else {
      this.authService.clearAuthData();
      this.router.navigate(['/']);
    }
  }

  /**
   * Navigation vers la page de changement de mot de passe
   */
  changePassword(): void {
    this.router.navigate(['/auth/change-password']);
  }
}

