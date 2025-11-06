import {
  Component,
  OnInit,
  signal,
  effect,
  DestroyRef,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Carrusel } from '@app/components/carrusel/carrusel';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PaqueteCardView } from '@app/models/PaquetesInterfaces/PaqueteCardView';
import { catchError, map, of } from 'rxjs';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, Carrusel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  paquetesPorCerrarse = signal<PaqueteCardView[]>([]);
  isLoading = signal<boolean>(false);

  // ✅ Flag para evitar múltiples llamadas
  private dataLoaded = false;
  private destroyRef = inject(DestroyRef);

  constructor(private paquetePublicadoService: PaquetePublicadoService) {
    console.log('🚀 Home constructor');
  }

  ngOnInit(): void {
    console.log('🚀 Home ngOnInit');
    if (!this.dataLoaded) {
      this.dataLoaded = true;
      //this.cargarPaquetesPorCerrarse();
    }
  }

  ngOnDestroy(): void {
    console.log('🚀 Home ngOnDestroy');
  }

  // cargarPaquetesPorCerrarse() {
  //   console.log('🔍 cargarPaquetesPorCerrarse() llamado');

  //   this.paquetePublicadoService
  //     .getPaquetesPorCerrarse()
  //     .pipe(
  //       map((paquetes: PaquetePublicado[]) =>
  //         paquetes.map((p) => this.mapToCardView(p))
  //       ),
  //       catchError((err) => {
  //         console.error('❌ Error al obtener paquetes:', err);
  //         return of([] as PaqueteCardView[]);
  //       })
  //     )
  //     .subscribe((cards) => {
  //       console.log('📦 Paquetes mapeados:', cards);
  //       this.paquetesPorCerrarse.set(cards);
  //     });
  // }
  // private mapToCardView(p: PaquetePublicado): PaqueteCardView {
  //   return {
  //     id: p.id_paquete_publicado ?? 0,
  //     nombre: p.paqueteBase?.nombre || 'Sin nombre',
  //     imagen: p.imagen_url || 'https://placehold.co/300x200?text=Sin+imagen',
  //     estado: p.estado?.nombre || 'Desconocido',
  //     cantidadActual: p.cant_productos_reservados ?? 0,
  //     cantidadMaxima: p.cant_productos ?? 0,
  //   };
  // }
}
