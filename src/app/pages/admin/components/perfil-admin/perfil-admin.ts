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
import { ToastService } from '@app/services/toast/toast.service';

import { AdminPaqueteCard } from '@app/shared/admin-paquete-card/admin-paquete-card';

@Component({
  selector: 'app-perfil-admin',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent, AdminPaqueteCard],
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

  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // --- Acciones de la Card ---

  private toastService = inject(ToastService);

  editarPaquete(paquete: PaquetePublicado) {
    console.log('✏️ Editando publicación desde perfil:', paquete.id_paquete_publicado);
    this.router.navigate(['/admin/publicar-paquete'], { queryParams: { id: paquete.id_paquete_publicado, edit: true } });
  }

  notificarCierre(paquete: PaquetePublicado) {
    console.log('🔔 Notificando cierre de:', paquete.paqueteBase?.nombre);
  }

  cerrarPaqueteDesdeCard(paquete: PaquetePublicado) {
    // Cierre desde el perfil: navega a administrar-publicaciones con el paquete destacado
    this.navigateToPublicacionDetalle(paquete.id_paquete_publicado!);
  }

  finalizarPaquete(paquete: PaquetePublicado) {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: '¿Finalizar paquete?',
        text: `Se marcará "${paquete.paqueteBase?.nombre}" como completado.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          console.log('✅ Finalizando paquete:', paquete.id_paquete_publicado);
          this.paquetePublicadoService.completarPaquete(paquete.id_paquete_publicado!).subscribe({
            next: () => {
              this.toastService.success('Paquete finalizado con éxito');
              this.loadPaquetesPorCerrarse();
            },
            error: () => this.toastService.error('Error al finalizar el paquete')
          });
        }
      });
    });
  }

  reembolsarPaquete(paquete: PaquetePublicado) {
    import('sweetalert2').then((Swal) => {
      Swal.default.fire({
        title: '¿Cancelar y Reembolsar?',
        text: 'ESTO DEVOLVERÁ EL DINERO A TODOS LOS USUARIOS. Acción irreversible.',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#E53935',
        confirmButtonText: 'SÍ, REEMBOLSAR',
        cancelButtonText: 'No, volver'
      }).then(result => {
        if (result.isConfirmed) {
          console.log('🚨 Iniciando reembolso para:', paquete.id_paquete_publicado);
          this.paquetePublicadoService.cancelarPaquete(paquete.id_paquete_publicado!).subscribe({
            next: () => {
              this.toastService.success('Paquete cancelado y reembolsos procesados');
              this.loadPaquetesPorCerrarse();
            },
            error: () => this.toastService.error('Error al procesar el reembolso')
          });
        }
      });
    });
  }

  duplicarPaquete(paquete: PaquetePublicado) {
    console.log('📋 Duplicando publicación desde perfil:', paquete.id_paquete_publicado);
    this.paquetePublicadoService.duplicarPaquete(paquete.id_paquete_publicado!).subscribe({
      next: () => {
        this.toastService.success('Publicación duplicada con éxito');
        this.loadPaquetesPorCerrarse();
      },
      error: () => this.toastService.error('Error al duplicar la publicación')
    });
  }

  // 🧭 Navegaciones

  navigateToAdminProducts() {
    this.router.navigate(['/admin/administrar-productos']);
  }

  navigateToAdminPackages() {
    this.router.navigate(['/admin/administrar-paquetes']);
  }

  navigateToAdminPublicaciones() {
    this.router.navigate(['/admin/administrar-publicaciones']);
  }

  /** Navega a administrar-publicaciones con el paquete destacado */
  navigateToPublicacionDetalle(id: number) {
    this.router.navigate(['/admin/administrar-publicaciones'], { queryParams: { highlight: id } });
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
