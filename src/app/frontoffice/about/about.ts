import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { DifferentiatorsComponent } from '../../shared/differentiators/differentiators';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, DifferentiatorsComponent],
  templateUrl: './about.html',
  styleUrls: ['./about.css']
})
export class AboutComponent {}

