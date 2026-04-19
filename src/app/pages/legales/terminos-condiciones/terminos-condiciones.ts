import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoWrapperComponent } from '../../../shared/catalogo-wrapper/catalogo-wrapper';

@Component({
  selector: 'app-terminos-condiciones',
  standalone: true,
  imports: [CommonModule, CatalogoWrapperComponent],
  templateUrl: './terminos-condiciones.html'
})
export class TerminosCondiciones {}
