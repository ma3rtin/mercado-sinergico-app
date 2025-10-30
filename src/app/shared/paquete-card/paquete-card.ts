import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';


@Component({
  selector: 'app-paquete-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './paquete-card.html',
  styleUrl: './paquete-card.css'
})
export class PaqueteCard {
@Input() nombre?: string;
@Input() imagen?: string;
@Input() estado?: string;
@Input() cantidadActual!: number;
@Input() cantidadMaxima!: number;
}
