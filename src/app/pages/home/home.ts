import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Carrusel } from '@app/components/carrusel/carrusel';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PaqueteCardView } from '@app/models/PaquetesInterfaces/PaqueteCardView';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, Carrusel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  paquetesPorCerrarse: PaqueteCardView[] = [];

  constructor(private paquetePublicadoService: PaquetePublicadoService) {}

  ngOnInit(): void {
    this.cargarPaquetesPorCerrarse();
  }

  cargarPaquetesPorCerrarse(): void {
    this.paquetePublicadoService.getPaquetesPorCerrarse().subscribe({
      next: (data) => {
        this.paquetesPorCerrarse = data.map((p) => ({
          id: p.id_paquete_publicado ?? 0,
          nombre: p.paqueteBase?.nombre || '',
          imagen: p.paqueteBase?.imagen_url || '',
          estado: p.estado?.nombre || '',
          cantidadActual: p.cant_productos ?? 0,
          cantidadMaxima: 10,
        }));
      },
      error: (err) => console.error('Error al cargar paquetes por cerrarse:', err),
    });
  }
}
