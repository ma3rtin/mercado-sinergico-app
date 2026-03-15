import { Component, input } from '@angular/core';

@Component({
  selector: 'app-faq-item',
  standalone: true,
  templateUrl: './faq-item.html'
})
export class FaqItemComponent {
  pregunta = input.required<string>();
}
