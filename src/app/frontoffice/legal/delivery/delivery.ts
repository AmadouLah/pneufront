import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegalLayoutComponent } from '../legal-layout';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [CommonModule, LegalLayoutComponent],
  templateUrl: './delivery.html'
})
export class DeliveryComponent {}

