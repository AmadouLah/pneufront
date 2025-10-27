import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { Authservice } from '../../services/authservice';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environement';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ReactiveFormsModule],
  templateUrl: './profil.html',
  styleUrls: ['./profil.css']
})
export class ProfilComponent implements OnInit {
  user = signal<any>(null);
  isLoading = signal(false);
  showEditModal = signal(false);
  showVerifyModal = signal(false);
  showAddAddressModal = signal(false);
  
  editForm: FormGroup;
  verifyForm: FormGroup;
  addressForm: FormGroup;
  originalEmail = '';
  errorMessage = signal('');
  successMessage = signal('');

  countries = [
    { name: 'Mali', code: 'MALI', prefix: '+223' },
    { name: 'Maroc', code: 'MOROCCO', prefix: '+212' },
    { name: 'Burkina Faso', code: 'BURKINA_FASO', prefix: '+226' },
    { name: 'Sénégal', code: 'SENEGAL', prefix: '+221' },
    { name: 'Côte d\'Ivoire', code: 'IVORY_COAST', prefix: '+225' }
  ];

  regions = ['Bamako', 'Kayes', 'Koulikoro', 'Sikasso', 'Ségou', 'Mopti', 'Tombouctou', 'Gao', 'Kidal'];

  constructor(
    private authService: Authservice,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.editForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.email]]
    });

    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.addressForm = this.fb.group({
      isDefault: [false],
      country: ['MALI', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      region: ['Bamako', Validators.required],
      postalCode: [''],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadUserInfo();
  }

  /**
   * Charge les informations de l'utilisateur depuis le localStorage
   */
  private loadUserInfo(): void {
    const userInfo = this.authService.authUser();
    if (userInfo) {
      this.user.set(userInfo);
      this.originalEmail = userInfo.email;
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Recharge les informations utilisateur depuis le localStorage
   * Utilisé après mise à jour du profil
   */
  private refreshUserInfo(): void {
    const userInfo = this.authService.authUser();
    if (userInfo) {
      // Force la mise à jour du signal avec les nouvelles données
      this.user.set({
        ...userInfo,
        // Force Angular à détecter le changement
        _timestamp: Date.now()
      });
      this.originalEmail = userInfo.email;
    }
  }

  /**
   * Ouvre le modal d'édition
   */
  openEditModal(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.editForm.patchValue({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email
      });
      this.originalEmail = currentUser.email;
    }
    this.showEditModal.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Ferme le modal d'édition
   */
  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editForm.reset();
  }

  /**
   * Sauvegarde les modifications du profil
   */
  saveProfile(): void {
    if (this.editForm.invalid) return;

    const formData = this.editForm.value;
    const emailChanged = formData.email !== this.originalEmail;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const updateData: any = {};
    if (formData.firstName) updateData.firstName = formData.firstName;
    if (formData.lastName) updateData.lastName = formData.lastName;
    if (formData.email) updateData.email = formData.email;

    this.http.put(`${environment.apiUrl}/users/profile`, updateData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        
        if (emailChanged) {
          this.closeEditModal();
          this.showVerifyModal.set(true);
        } else {
          this.user.set({ ...this.user(), ...updateData });
          this.successMessage.set('Profil mis à jour avec succès');
          setTimeout(() => this.closeEditModal(), 1500);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  /**
   * Ferme le modal de vérification
   */
  closeVerifyModal(): void {
    this.showVerifyModal.set(false);
    this.verifyForm.reset();
  }

  /**
   * Vérifie le code de vérification email
   */
  verifyEmail(): void {
    if (this.verifyForm.invalid) return;

    const code = this.verifyForm.value.code;
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.http.post(`${environment.apiUrl}/auth/verify-email-change`, { code }).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        
        // Sauvegarder les nouveaux tokens et userInfo
        this.authService.saveAuthData(response);
        
        // Fermer le modal de vérification
        this.closeVerifyModal();
        
        // Recharger les infos utilisateur avec le nouveau profil
        this.refreshUserInfo();
        
        // Message de succès
        this.successMessage.set('Email vérifié avec succès. Votre profil a été mis à jour.');
        
        // Effacer le message après 3 secondes
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Code invalide');
      }
    });
  }

  /**
   * Renvoie le code de vérification
   */
  resendCode(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.http.post(`${environment.apiUrl}/auth/resend-verification`, {}).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Code renvoyé avec succès');
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Erreur lors de l\'envoi du code');
      }
    });
  }

  /**
   * Ouvre le modal d'ajout d'adresse
   */
  openAddAddressModal(): void {
    this.addressForm.reset({
      isDefault: false,
      country: 'MALI',
      region: 'Bamako'
    });
    this.showAddAddressModal.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Ferme le modal d'ajout d'adresse
   */
  closeAddAddressModal(): void {
    this.showAddAddressModal.set(false);
    this.addressForm.reset();
  }

  /**
   * Obtient le préfixe téléphonique du pays sélectionné
   */
  getPhonePrefix(): string {
    const country = this.addressForm.get('country')?.value;
    const selectedCountry = this.countries.find(c => c.code === country);
    return selectedCountry?.prefix || '+223';
  }

  /**
   * Sauvegarde l'adresse
   */
  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.http.post(`${environment.apiUrl}/addresses`, this.addressForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Adresse ajoutée avec succès');
        setTimeout(() => {
          this.closeAddAddressModal();
          this.loadUserInfo();
        }, 1500);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Erreur lors de l\'ajout de l\'adresse');
      }
    });
  }
}

