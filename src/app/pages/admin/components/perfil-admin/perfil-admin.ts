import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { EstadoPaquetePublicado } from '@app/models/PaquetesInterfaces/EstadoPaquetePublicado';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';

@Component({
  selector: 'app-perfil-admin',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './perfil-admin.html',
  styleUrl: './perfil-admin.css',
})
export class PerfilAdmin implements OnInit {
  private paquetePublicadoService = inject(PaquetePublicadoService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  paquetes = signal<PaquetePublicado[]>([]);
  usuario = signal<Usuario | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  estado = signal<EstadoPaquetePublicado[]>([
    { id_estado: 1, nombre: 'Pendiente' },
    { id_estado: 2, nombre: 'Abierto' },
    { id_estado: 3, nombre: 'Cerrado' },
    { id_estado: 4, nombre: 'Completo' },
  ]);

  ngOnInit() {
    this.loadPerfil();
    this.loadPaquetesPorCerrarse();
  }

  loadPerfil() {
    this.usuarioService.getPerfil().subscribe({
      next: (usuario) => {
        console.log('👤 Perfil cargado:', usuario);
        this.usuario.set(usuario);
      },
      error: (err) => {
        console.error('❌ Error al cargar perfil:', err);
        this.error.set('No se pudo cargar el perfil del usuario.');
      },
    });
  }

  // 🔥 NUEVO: Cargar paquetes por cerrarse usando el endpoint específico
  loadPaquetesPorCerrarse() {
    this.loading.set(true);
    this.error.set(null);

    this.paquetePublicadoService.getPaquetesPorCerrarse().subscribe({
      next: (paquetes) => {
        console.log('📦 Paquetes por cerrarse:', paquetes);
        this.paquetes.set(paquetes);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Error loading packages:', err);
        this.error.set('Ocurrió un error al cargar los paquetes.');
        this.loading.set(false);
      },
    });
  }

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

  // 📅 Calcular días restantes hasta el cierre
  getDiasRestantes(fechaFin?: Date): number {
    if (!fechaFin) return 0;
    const hoy = new Date();
    const cierre = new Date(fechaFin);
    const diferencia = cierre.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  // 🎨 Color según urgencia
  getUrgenciaColor(dias: number): string {
    if (dias <= 1) return 'text-red-600 font-bold';
    if (dias <= 3) return 'text-orange-600 font-semibold';
    if (dias <= 5) return 'text-yellow-600';
    return 'text-gray-600';
  }

  // 🧭 Navegaciones
  navigateToAdminProducts() {
    this.router.navigate(['/admin/administrar-productos']);
  }

  navigateToAdminUsers() {
    console.log('Por implementar');
  }

  navigateToMetrics() {
    console.log('Por implementar');
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

  // 🎯 Editar paquete (clickeando la card o el botón)
  editPackage(paquete: PaquetePublicado, event?: Event) {
    if (event) {
      event.stopPropagation(); // Evitar doble navegación si se clickea el botón
    }
    console.log('✏️ Editando paquete:', paquete.id_paquete_publicado);
    this.router.navigate(['/admin/paquetes/editar', paquete.id_paquete_publicado]);
  }

  crearProducto() {
    this.router.navigate(['/admin/crear-producto']);
  }

  crearPaquete() {
    this.router.navigate(['/admin/crear-paquete']);
  }

  // 📊 Formatear fecha
  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
