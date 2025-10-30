import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
//import { StatusColorPipe } from '../../../../shared/status-color/status-color-pipe';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import {PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
@Component({
  selector: 'app-perfil-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil-admin.html',
  styleUrl: './perfil-admin.css'
})
export class PerfilAdmin implements OnInit {
  private paquetePublicadoService = inject(PaquetePublicadoService);
  private router = inject(Router);

  paquetes: PaquetePublicado[] = [];


  ngOnInit() {
    this.loadPaquetes();
  }

  loadPaquetes() {
    this.paquetePublicadoService.getPaquetes().subscribe({
      next: (paquetes) => {
        this.paquetes = paquetes;
      },
      error: (error) => {
        console.error('Error loading packages:', error);
      }
    });
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Abierto':
        return 'text-blue-600';
      case 'Pendiente':
        return 'text-yellow-600';
      case 'Cerrado':
        return 'text-red-600';
      case 'Completo':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  }

  // Navigation methods
  navigateToAdminProducts() {
    this.router.navigate(['/administrar-productos']);
  }

  navigateToAdminUsers() {
    // this.router.navigate(['/admin/usuarios']);
    console.log('Navigate to admin users - not implemented yet');
  }

  navigateToMetrics() {
    // this.router.navigate(['/admin/metricas']);
    console.log('Navigate to metrics - not implemented yet');
  }

  navigateToAdminPackages() {
    this.router.navigate(['/admin/paquetes']);
  }

  editPackage(paquete: PaquetePublicado) {
    this.router.navigate(['/admin/paquetes/edit', paquete.id_paquete_publicado]);
  }

  // Create methods (for the yellow buttons)
  crearProducto() {
    this.router.navigate(['/crear-producto']);
  }

  crearPaquete() {
    this.router.navigate(['/crear-paquete']);
  }
}
