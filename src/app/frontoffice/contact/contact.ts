import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { FormHelperService } from '../../shared/services/form-helper.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent, FooterComponent],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css']
})
export class ContactComponent {
  contactForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private formBuilder: FormBuilder,
    private formHelper: FormHelperService
  ) {
    this.contactForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', FormHelperService.emailValidator],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  getFieldError(fieldName: string): string {
    return this.formHelper.getFieldError(fieldName, this.contactForm);
  }

  hasFieldError(fieldName: string): boolean {
    return this.formHelper.hasFieldError(fieldName, this.contactForm);
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.formHelper.markAllFieldsAsTouched(this.contactForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    // Simuler l'envoi du message
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set('Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
      this.contactForm.reset();
    }, 1500);
  }
}

