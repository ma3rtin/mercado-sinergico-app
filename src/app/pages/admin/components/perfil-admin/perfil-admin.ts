import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { EstadoPaquetePublicado } from '@app/models/PaquetesInterfaces/EstadoPaquetePublicado';
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';

@Component({
  selector: 'app-perfil-admin',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './perfil-admin.html',
  styleUrl: './perfil-admin.css'
})
export class PerfilAdmin implements OnInit {
  private paquetePublicadoService = inject(PaquetePublicadoService);
  private router = inject(Router);

  paquetes = signal<PaquetePublicado[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  //export interface EstadoPaquetePublicado {
  //id_estado: number;
  //nombre: string;

  // Relaciones
  //paquetes?: PaquetePublicado[];
  estado = signal<EstadoPaquetePublicado[]>([
    { id_estado: 1, nombre: 'Pendiente' },
    { id_estado: 2, nombre: 'Abierto' },
    { id_estado: 3, nombre: 'Cerrado' },
    { id_estado: 4, nombre: 'Completo' }
  ]);

  ngOnInit() {
    this.loadPaquetes();
  }

  loadPaquetes() {
    this.loading.set(true);
    this.error.set(null);

    this.paquetePublicadoService.getPaquetes().subscribe({
      next: (paquetes) => {
        this.paquetes.set(paquetes);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading packages:', err);
        this.error.set('Ocurrió un error al cargar los paquetes.');
        this.loading.set(false);
      }
    });
  }

  getStatusColor(estado: EstadoPaquetePublicado): string {
    if (estado.nombre === 'Pendiente') return 'text-yellow-600';
    if (estado.nombre === 'Abierto') return 'text-green-600';
    if (estado.nombre === 'Cerrado') return 'text-blue-600';
    if (estado.nombre === 'Completo') return 'text-gray-600';
    return 'text-gray-600';
  }

  // Navegaciones
  navigateToAdminProducts() { this.router.navigate(['/administrar-productos']); }
  navigateToAdminUsers() { console.log('Navigate to admin users - not implemented yet'); }
  navigateToMetrics() { console.log('Navigate to metrics - not implemented yet'); }
  navigateToAdminPackages() { this.router.navigate(['/admin/paquetes']); }

  editPackage(paquete: PaquetePublicado) {
    this.router.navigate(['/admin/paquetes/edit', paquete.id_paquete_publicado]);
  }

  crearProducto() { this.router.navigate(['/crear-producto']); }
  crearPaquete() { this.router.navigate(['/crear-paquete']); }
}
