import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';
import { EstadoPaquetePublicado } from '@app/models/PaquetesInterfaces/EstadoPaquetePublicado';
import { ButtonComponent } from '@app/shared/botones-component/buttonComponent';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';
import { ToastrService } from 'ngx-toastr';

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
  private toastr = inject(ToastrService);


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
    this.loadPaquetes();
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

  loadPaquetes() {
    this.loading.set(true);
    this.error.set(null);

    this.paquetePublicadoService.getPaquetes().subscribe({
      next: (paquetes) => {
        console.log('✅ Paquetes cargados:', paquetes);
        this.paquetes.set(paquetes);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading packages:', err);
        this.error.set('Ocurrió un error al cargar los paquetes.');
        this.loading.set(false);
      },
    });
  }

  getStatusColor(estado: EstadoPaquetePublicado): string {
    switch (estado.nombre) {
      case 'Pendiente':
        return 'text-yellow-600';
      case 'Abierto':
        return 'text-green-600';
      case 'Cerrado':
        return 'text-blue-600';
      case 'Completo':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
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

  //  editPackage(paquete: PaquetePublicado) {
  editPackage() {
    // this.router.navigate(['/admin/paquetes/edit', paquete.id_paquete_publicado]);
    this.toastr.info('Funcionalidad de edición de paquetes aún no implementada.');
  }

  crearProducto() {
    this.router.navigate(['/admin/crear-producto']);
  }
  crearPaquete() {
    this.router.navigate(['/admin/crear-paquete']);
  }
}
