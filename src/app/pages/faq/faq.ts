import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoWrapperComponent } from '@app/shared/catalogo-wrapper/catalogo-wrapper';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, CatalogoWrapperComponent],
  templateUrl: './faq.html',
})
export class FaqComponent {
  // Las preguntas están hardcodeadas en el HTML por ahora, como se solicitó para mantener la simplicidad y el estilo.
}
