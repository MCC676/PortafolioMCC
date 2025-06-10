import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private theme = inject(ThemeService);
  currentTheme: string = 'auto';

  ngOnInit(): void {
    this.currentTheme = this.theme.getCurrentTheme();
  }

  changeTheme(theme: 'light' | 'dark' | 'auto') {
    this.theme.setTheme(theme);
    this.currentTheme = theme;
    console.log('THIS IS YOUR MODE', this.currentTheme);
  }
}
