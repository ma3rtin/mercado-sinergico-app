// ============================================
// HOME COMPONENT - Mapeo Correcto de Datos
// ============================================
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
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { Carrusel } from '@app/components/carrusel/carrusel';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, CommonModule, Carrusel],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit {
  // 📦 Signal que almacena los paquetes directamente (sin mapeo)
  paquetesPorCerrarse = signal<PaquetePublicado[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  private dataLoaded = false;
  private destroyRef = inject(DestroyRef);

  constructor(private paquetePublicadoService: PaquetePublicadoService) {}

  ngOnInit(): void {
    if (!this.dataLoaded) {
      this.dataLoaded = true;
      this.cargarPaquetesPorCerrarse();
    }
  }

  // 🔍 Obtener datos del backend
  private cargarPaquetesPorCerrarse(): void {
    console.log('🔍 cargarPaquetesPorCerrarse() llamado');
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.paquetePublicadoService
      .getPaquetesPorCerrarse() // Llamamos al endpoint
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        // ✅ NO mapeamos, pasamos directo los datos de PaquetePublicado
        catchError((err) => {
          console.error('❌ Error al obtener paquetes:', err);
          this.errorMessage.set('Error al cargar paquetes. Intenta de nuevo más tarde.');
          this.isLoading.set(false);
          return of([] as PaquetePublicado[]);
        })
      )
      .subscribe((paquetes) => {
        console.log('📦 Paquetes recibidos:', paquetes);
        console.log('📊 Cantidad:', paquetes.length);

        // Debug: mostrar primer paquete
        if (paquetes.length > 0) {
          console.log('🔍 Primer paquete:', paquetes[0]);
          console.log('  - Nombre:', paquetes[0].paqueteBase?.nombre);
          console.log('  - Marca:', paquetes[0].paqueteBase?.marca?.nombre);
          console.log('  - Categoría:', paquetes[0].paqueteBase?.categoria?.nombre);
          console.log('  - Imagen:', paquetes[0].imagen_url);
        }

        this.paquetesPorCerrarse.set(paquetes);
        this.isLoading.set(false);
      });
  }

  // 🔄 Método público para recargar
  recargarPaquetes(): void {
    this.cargarPaquetesPorCerrarse();
  }
}
