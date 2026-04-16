import { Component, input } from '@angular/core';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
  selector: 'app-faq-item',
  standalone: true,
  templateUrl: './faq-item.html',
  styles: [`
    :host {
      display: block;
    }
  `],
  imports: [IconComponent]
})
export class FaqItemComponent {
  pregunta = input.required<string>();
}
