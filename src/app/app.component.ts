import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormWizardComponent } from './form-wizard/form-wizard.component';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FormWizardComponent,
    HeaderComponent
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      <main class="main-content">
        <app-form-wizard></app-form-wizard>
      </main>
    </div>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'data-collection-demo';
}
