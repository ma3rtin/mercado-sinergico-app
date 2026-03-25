import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoWrapperComponent } from '../../../shared/catalogo-wrapper/catalogo-wrapper';

@Component({
  selector: 'app-politica-devoluciones',
  standalone: true,
  imports: [CommonModule, CatalogoWrapperComponent],
  templateUrl: './politica-devoluciones.html'
})
export class PoliticaDevoluciones {}
