import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './shared/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly languageService = inject(LanguageService);
  title = 'PneuMali';

  ngOnInit(): void {
    const savedLang = localStorage.getItem('preferredLanguage') || 'fr';
    this.languageService.currentLanguage.set(savedLang as 'fr' | 'en');
    document.documentElement.lang = savedLang;
  }
}
