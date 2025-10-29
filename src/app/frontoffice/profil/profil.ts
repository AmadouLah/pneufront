import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { Authservice } from '../../services/authservice';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ReactiveFormsModule],
  templateUrl: './profil.html',
  styleUrls: ['./profil.css']
})
export class ProfilComponent implements OnInit {
  user = signal<any>(null);
  addresses = signal<any[]>([]);
  isLoading = signal(false);
  showEditModal = signal(false);
  showVerifyModal = signal(false);
  showAddAddressModal = signal(false);
  editingAddressId = signal<number | null>(null);
  
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

    // Formulaire d'adresse : champs obligatoires selon les standards e-commerce
    this.addressForm = this.fb.group({
      isDefault: [false],
      country: ['MALI', Validators.required],
      street: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      region: ['Bamako', Validators.required],
      postalCode: [''], // Optionnel
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]]
    });
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadAddresses();
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
   * Charge les adresses de l'utilisateur
   */
  private loadAddresses(): void {
    this.http.get(`${environment.apiUrl}/addresses`).subscribe({
      next: (addresses: any) => {
        this.addresses.set(addresses);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des adresses:', error);
      }
    });
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

    // Toujours envoyer tous les champs pour garantir la mise à jour complète
    const updateData = {
      firstName: formData.firstName?.trim() || '',
      lastName: formData.lastName?.trim() || '',
      email: formData.email?.trim() || this.originalEmail
    };

    this.http.put(`${environment.apiUrl}/users/profile`, updateData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        
        if (emailChanged) {
          // Si l'email change, ouvrir le modal de vérification
          this.closeEditModal();
          this.showVerifyModal.set(true);
        } else {
          // Récupérer l'utilisateur mis à jour depuis la réponse backend
          if (response.user) {
            const updatedUserInfo = {
              id: response.user.id,
              email: response.user.email,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              role: response.user.role
            };
            
            // Mettre à jour le localStorage (CRUCIAL pour persister les données)
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            
            // Mettre à jour le signal local
            this.user.set(updatedUserInfo);
          }
          
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
   * Ouvre le modal d'ajout d'une nouvelle adresse
   */
  openAddAddressModal(): void {
    // Mode ajout : valeurs par défaut
    this.editingAddressId.set(null);
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
   * Ouvre le modal pour éditer une adresse spécifique
   */
  editAddress(addressId: number): void {
    const address = this.addresses().find(a => a.id === addressId);
    
    if (!address) {
      this.errorMessage.set('Adresse non trouvée');
      return;
    }
    
    // Charger les données de l'adresse
    this.editingAddressId.set(addressId);
    this.addressForm.patchValue({
      isDefault: address.default || false,
      country: address.country || 'MALI',
      street: address.street || '',
      city: address.city || '',
      region: address.region || 'Bamako',
      postalCode: address.postalCode || '',
      phoneNumber: address.phoneNumber || ''
    });
    
    this.showAddAddressModal.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  /**
   * Ferme le modal d'ajout d'adresse et réinitialise tout
   */
  closeAddAddressModal(): void {
    this.showAddAddressModal.set(false);
    this.editingAddressId.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.addressForm.reset({
      isDefault: false,
      country: 'MALI',
      region: 'Bamako'
    });
  }

  /**
   * Supprime une adresse spécifique
   */
  deleteAddress(addressId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.http.delete(`${environment.apiUrl}/addresses/${addressId}`).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Adresse supprimée avec succès');
        
        // Recharger immédiatement les adresses
        this.loadAddresses();
        
        // Effacer le message après 3 secondes
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Erreur lors de la suppression de l\'adresse');
      }
    });
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
   * Sauvegarde l'adresse (ajout ou modification)
   * Tous les champs obligatoires doivent être remplis
   */
  saveAddress(): void {
    // Marquer tous les champs comme "touched" pour afficher les erreurs
    Object.keys(this.addressForm.controls).forEach(key => {
      this.addressForm.get(key)?.markAsTouched();
    });

    if (this.addressForm.invalid) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const addressId = this.editingAddressId();
    const apiCall = addressId
      ? this.http.put(`${environment.apiUrl}/addresses/${addressId}`, this.addressForm.value)
      : this.http.post(`${environment.apiUrl}/addresses`, this.addressForm.value);

    apiCall.subscribe({
      next: () => {
        this.isLoading.set(false);
        
        // Recharger immédiatement les adresses
        this.loadAddresses();
        
        // Afficher le message de succès
        this.successMessage.set(addressId ? 'Adresse modifiée avec succès' : 'Adresse enregistrée avec succès');
        
        // Fermer le modal après un court délai pour que l'utilisateur voie le message
        setTimeout(() => {
          this.closeAddAddressModal();
          this.successMessage.set('');
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Erreur lors de l\'enregistrement de l\'adresse');
      }
    });
  }

  /**
   * Vérifie si un champ est invalide et a été touché (pour afficher l'erreur)
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.addressForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}

