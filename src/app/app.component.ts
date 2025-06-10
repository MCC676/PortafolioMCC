import { Component } from '@angular/core';
import { Router, RouterOutlet, Event, NavigationEnd } from '@angular/router';
import { HeaderComponent } from "./components/header/header.component";
import { ContentComponent } from "./components/content/content.component";
import { FooterComponent } from "./components/footer/footer.component";
@Component({
  selector: 'app-root',
  imports: [HeaderComponent, ContentComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'portfolio';

  constructor(private router: Router) {
  }

  ngOnInit() {
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        setTimeout(() => window.HSStaticMethods.autoInit(), 100);
      }
    });
  }
}
