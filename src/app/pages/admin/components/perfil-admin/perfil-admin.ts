import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { EstadoPaquetePublicado } from '@app/models/PaquetesInterfaces/EstadoPaquetePublicado';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { IconComponent } from '@app/shared/icono/icono';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';

@Component({
  selector: 'app-perfil-admin',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  templateUrl: './perfil-admin.html',
  styleUrl: './perfil-admin.css',
})
export class PerfilAdmin implements OnInit {
  // 🔧 Servicios
  private paquetePublicadoService = inject(PaquetePublicadoService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  // 📊 Señales principales
  paquetes = signal<PaquetePublicado[]>([]);
  usuario = signal<Usuario | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadPerfil();
    this.loadPaquetesPorCerrarse();
  }

  // 👤 Cargar perfil del usuario
  loadPerfil() {
    this.usuarioService.getPerfil().subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.error.set('No se pudo cargar el perfil del usuario.');
      },
    });
  }

  // 📦 Cargar paquetes próximos a cerrarse
  loadPaquetesPorCerrarse() {
    this.loading.set(true);
    this.error.set(null);

    this.paquetePublicadoService.getPaquetesPorCerrarse().subscribe({
      next: (paquetes) => {
        this.paquetes.set(paquetes);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar paquetes:', err);
        this.error.set('Ocurrió un error al cargar los paquetes.');
        this.loading.set(false);
      },
    });
  }

  // 🎨 Métodos de estilo y helpers

  getStatusColor(estado?: EstadoPaquetePublicado): string {
    if (!estado) return 'text-gray-600';

    switch (estado.nombre.toLowerCase()) {
      case 'pendiente':
        return 'text-yellow-600';
      case 'abierto':
      case 'activo':
        return 'text-green-600';
      case 'cerrado':
        return 'text-blue-600';
      case 'completo':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  }

  getStatusDotColor(estado?: EstadoPaquetePublicado): string {
    if (!estado) return 'bg-gray-400';

    switch (estado.nombre.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-500';
      case 'abierto':
      case 'activo':
        return 'bg-green-500';
      case 'cerrado':
        return 'bg-blue-500';
      case 'completo':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  }

  getDiasRestantes(fechaFin?: Date): number {
    if (!fechaFin) return 0;
    const hoy = new Date();
    const cierre = new Date(fechaFin);
    const diferencia = cierre.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  getUrgenciaColor(dias: number): string {
    if (dias <= 0) return 'text-red-600';
    if (dias === 1) return 'text-red-600';
    if (dias <= 3) return 'text-orange-600';
    if (dias <= 5) return 'text-yellow-600';
    return 'text-gray-600';
  }

  getUrgenciaBackgroundColor(dias: number): string {
    if (dias <= 0) return 'bg-red-500';
    if (dias === 1) return 'bg-red-500';
    if (dias <= 3) return 'bg-orange-500';
    if (dias <= 5) return 'bg-yellow-500';
    return 'bg-gray-500';
  }

  getStockPercentage(paquete: PaquetePublicado): number {
    if (!paquete.cant_productos || paquete.cant_productos === 0) return 0;
    const reservados = paquete.cant_productos_reservados || 0;
    return (reservados / paquete.cant_productos) * 100;
  }

  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // 🧭 Navegaciones

  navigateToAdminProducts() {
    this.router.navigate(['/admin/administrar-productos']);
  }

  navigateToAdminPackages() {
    this.router.navigate(['/admin/administrar-paquetes']);
  }

  navigateToAdminTemplates() {
    this.router.navigate(['/admin/administrar-plantillas']);
  }

  navigateToAdminPostPackages() {
    this.router.navigate(['/admin/publicar-paquete']);
  }

  crearProducto() {
    this.router.navigate(['/admin/crear-producto']);
  }

  crearPaquete() {
    this.router.navigate(['/admin/crear-paquete']);
  }
}
