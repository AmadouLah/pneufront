import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly currentLanguage = signal<'fr' | 'en'>('fr');

  /**
   * Change la langue de l'application
   */
  setLanguage(lang: 'fr' | 'en'): void {
    this.currentLanguage.set(lang);
    localStorage.setItem('preferredLanguage', lang);
    document.documentElement.lang = lang;
  }

  /**
   * Récupère la langue actuelle
   */
  getCurrentLanguage(): 'fr' | 'en' {
    return this.currentLanguage();
  }
}

