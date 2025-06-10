import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private html = document.documentElement;

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const theme = localStorage.getItem('hs_theme') || 'auto';

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const isLightOrAuto =
      theme === 'light' || (theme === 'auto' && !prefersDark);
    const isDarkOrAuto = theme === 'dark' || (theme === 'auto' && prefersDark);

    if (isLightOrAuto && this.html.classList.contains('dark')) {
      this.html.classList.remove('dark');
    } else if (isDarkOrAuto && !this.html.classList.contains('dark')) {
      this.html.classList.add('dark');
    }
  }

  setTheme(theme: 'light' | 'dark' | 'auto') {
    localStorage.setItem('hs_theme', theme);
    this.initTheme(); // Reaplica la lógica
  }

  getCurrentTheme(): string {
    return localStorage.getItem('hs_theme') || 'auto';
  }
}
