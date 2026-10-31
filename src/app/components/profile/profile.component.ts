import { Component } from '@angular/core';
import { RevealDirective } from '../../directives/reveal.directive';

@Component({
  selector: 'app-profile',
  imports: [RevealDirective],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  /** Tecnologías con las que trabajo a diario, no una lista exhaustiva. */
  readonly stack = [
    'C#/.NET',
    'ASP.NET Core',
    'SQL Server',
    'EF Core',
    'Dapper',
    'Angular',
    'REST/SOAP',
    'GitHub Actions',
    'Docker',
    'AWS',
    'Python',
  ];
}
