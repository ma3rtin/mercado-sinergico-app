import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoWrapperComponent } from '@app/shared/catalogo-wrapper/catalogo-wrapper';
import { FaqItemComponent } from '@app/components/faq-item/faq-item';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, CatalogoWrapperComponent, FaqItemComponent],
  templateUrl: './faq.html',
})
export class FaqComponent {
  // Las preguntas están hardcodeadas en el HTML por ahora, como se solicitó para mantener la simplicidad y el estilo.
}
