import { Component } from '@angular/core';
import { ProfileComponent } from "../profile/profile.component";
import { ExperienceComponent } from "../experience/experience.component";
import { ProjectsComponent } from "../projects/projects.component";

@Component({
  selector: 'app-content',
  imports: [ProfileComponent, ExperienceComponent, ProjectsComponent],
  templateUrl: './content.component.html',
  styleUrl: './content.component.css'
})
export class ContentComponent {
  section: string = 'about';
}
