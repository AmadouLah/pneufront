import { Injectable, signal, effect } from '@angular/core';

/**
 * Service centralisé pour la gestion du thème de l'application
 * Gère le mode clair et sombre avec persistance dans localStorage
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal réactif pour le thème actuel
  private readonly themeSignal = signal<'light' | 'dark'>(this.getInitialTheme());

  constructor() {
    // Effet qui applique le thème à chaque changement
    effect(() => {
      this.applyTheme(this.themeSignal());
    });
  }

  /**
   * Récupère le thème initial depuis localStorage ou utilise 'light' par défaut
   */
  private getInitialTheme(): 'light' | 'dark' {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
  }

  /**
   * Retourne le signal du thème (lecture seule)
   */
  get currentTheme() {
    return this.themeSignal.asReadonly();
  }

  /**
   * Change le thème de l'application
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.themeSignal.set(theme);
    localStorage.setItem('theme', theme);
  }

  /**
   * Toggle entre light et dark
   */
  toggleTheme(): void {
    const newTheme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Applique le thème au document
   */
  private applyTheme(theme: 'light' | 'dark'): void {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }

  /**
   * Vérifie si le mode sombre est actif
   */
  isDarkMode(): boolean {
    return this.themeSignal() === 'dark';
  }
}

