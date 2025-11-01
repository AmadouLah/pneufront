import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { FormHelperService } from '../../shared/services/form-helper.service';
import { Authservice } from '../../services/authservice';
import { environment } from '../../environment';
import { MessageResponse } from '../../shared/types/auth';

interface UserProfileResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, FooterComponent],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css', '../../auth/shared/auth-theme.css']
})
export class ContactComponent implements OnInit {
  private static readonly MESSAGE_MIN_LENGTH = 10;

  contactForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  readonly contactInfo = {
    address: 'Carbon Black Tyres, Shop ALG 9-10, Cnr Main Rd & Kyalami Downs, Kyalami Blvd, Midrand, 1686',
    hours: 'Monday – Friday, 8 AM – 4:30 PM',
    email: 'info@carbon-black.co.za',
    phone: '087 265 8280'
  };

  constructor(
    private formBuilder: FormBuilder,
    private formHelper: FormHelperService,
    private authService: Authservice,
    private http: HttpClient
  ) {
    this.contactForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', FormHelperService.emailValidator],
      phoneNumber: [''],
      message: ['', [Validators.required, Validators.minLength(ContactComponent.MESSAGE_MIN_LENGTH)]]
    });
  }

  ngOnInit(): void {
    this.prefillUserData();
  }

  private prefillUserData(): void {
    const userInfo = this.authService.authUser();
    if (userInfo) {
      const fullName = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ').trim();
      this.contactForm.patchValue({
        name: fullName || this.contactForm.value.name,
        email: userInfo.email || this.contactForm.value.email
      });
    }

    if (!this.authService.isLoggedIn()) {
      return;
    }

    this.http.get<UserProfileResponse>(`${environment.apiUrl}/users/profile`).subscribe({
      next: (profile) => {
        const profileName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
        this.contactForm.patchValue({
          name: profileName || this.contactForm.value.name,
          email: profile.email || this.contactForm.value.email,
          phoneNumber: profile.phoneNumber || this.contactForm.value.phoneNumber
        });
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil utilisateur', error);
      }
    });
  }

  getInputClasses(fieldName: string): string {
    return this.formHelper.getInputClasses(fieldName, this.contactForm);
  }

  getFieldError(fieldName: string): string {
    return this.formHelper.getFieldError(fieldName, this.contactForm);
  }

  hasFieldError(fieldName: string): boolean {
    return this.formHelper.hasFieldError(fieldName, this.contactForm);
  }

  messageMinLength(): number {
    return ContactComponent.MESSAGE_MIN_LENGTH;
  }

  messageCharsRemaining(): number {
    const currentLength = (this.contactForm.get('message')?.value?.length ?? 0);
    return Math.max(ContactComponent.MESSAGE_MIN_LENGTH - currentLength, 0);
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.contactForm);
      return;
    }

    const payload = {
      name: this.contactForm.value.name?.trim(),
      email: this.contactForm.value.email?.trim(),
      phoneNumber: this.contactForm.value.phoneNumber?.trim() || null,
      message: this.contactForm.value.message?.trim()
    };

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.post<MessageResponse>(`${environment.apiUrl}/contact`, payload).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.contactForm.get('message')?.reset();
      },
      error: (error) => {
        this.errorMessage.set(this.formHelper.extractErrorMessage(error, 'Impossible d\'envoyer votre message pour le moment.'));
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }
}

