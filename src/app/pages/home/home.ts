import {
  Component,
  OnInit,
  signal,
  DestroyRef,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { Carrusel } from '@app/components/carrusel/carrusel';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PaqueteCardView } from '@app/models/PaquetesInterfaces/PaqueteCardView';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, Carrusel],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {
  paquetesPorCerrarse = signal<PaqueteCardView[]>([]);
  isLoading = signal<boolean>(false);

  private dataLoaded = false;
  private destroyRef = inject(DestroyRef);

  constructor(private paquetePublicadoService: PaquetePublicadoService) {
    console.log('🚀 Home constructor');
  }

  ngOnInit(): void {
    console.log('🚀 Home ngOnInit');
    if (!this.dataLoaded) {
      this.dataLoaded = true;
      this.cargarPaquetesPorCerrarse();
    }
  }

  ngOnDestroy(): void {
    console.log('🚀 Home ngOnDestroy');
  }

  cargarPaquetesPorCerrarse(): void {
    console.log('🔍 cargarPaquetesPorCerrarse() llamado');

    this.isLoading.set(true);

    this.paquetePublicadoService
      .getPaquetesPorCerrarse()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((paquetes: PaquetePublicado[]) =>
          paquetes.map((p) => this.mapToCardView(p))
        ),
        catchError((err) => {
          console.error('❌ Error al obtener paquetes:', err);
          this.isLoading.set(false);
          return of([] as PaqueteCardView[]);
        })
      )
      .subscribe((cards) => {
        console.log('📦 Paquetes mapeados:', cards);
        this.paquetesPorCerrarse.set(cards);
        this.isLoading.set(false);
      });
  }

  private mapToCardView(p: PaquetePublicado): PaqueteCardView {
    return {
      id: p.id_paquete_publicado ?? 0,
      nombre: p.paqueteBase?.nombre || 'Sin nombre',
      imagen: p.imagen_url || 'https://placehold.co/300x200?text=Sin+imagen',
      estado: p.estado?.nombre || 'Desconocido',
      cantidadActual: p.cant_productos_reservados ?? 0,
      cantidadMaxima: p.cant_productos ?? 0,
    };
  }
}
