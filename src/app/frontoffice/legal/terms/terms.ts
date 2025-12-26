import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegalLayoutComponent } from '../legal-layout';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, LegalLayoutComponent],
  templateUrl: './terms.html'
})
export class TermsComponent {
  readonly currentYear = new Date().getFullYear();
  readonly contactEmail = 'contact@pneumali.com';
}
