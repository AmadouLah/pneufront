import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LegalLayoutComponent } from '../legal-layout';

@Component({
  selector: 'app-mentions',
  standalone: true,
  imports: [CommonModule, LegalLayoutComponent],
  templateUrl: './mentions.html'
})
export class MentionsComponent {}
