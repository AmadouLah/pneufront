import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegalLayoutComponent } from '../legal-layout';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, LegalLayoutComponent],
  templateUrl: './privacy.html'
})
export class PrivacyComponent {
  readonly currentYear = new Date().getFullYear();
}
