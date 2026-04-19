import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoWrapperComponent } from '../../../shared/catalogo-wrapper/catalogo-wrapper';

@Component({
  selector: 'app-politica-privacidad',
  standalone: true,
  imports: [CommonModule, CatalogoWrapperComponent],
  templateUrl: './politica-privacidad.html'
})
export class PoliticaPrivacidad {}
