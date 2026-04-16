import { Component, EventEmitter, Output, inject, computed, signal, OnInit, effect } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@app/shared/icono/icono';
import { AuthService } from '../../services/auth/auth.service';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { Usuario } from '@app/models/UsuarioInterfaces/Usuario';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css'
})
export class Drawer implements OnInit {
  // 🔧 Servicios
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  // 📤 Outputs
  @Output() closeDrawer = new EventEmitter<void>();

  // 📊 Datos del usuario (Signals reactivos)
  user = this.authService.user;
  isLoggedIn = this.authService.isAuthenticated;
  userProfile = signal<Usuario | null>(null);

  constructor() {
    // 🔄 Efecto para cargar el perfil si cambia el estado de login
    effect(() => {
      if (this.isLoggedIn()) {
        this.loadProfile();
      } else {
        this.userProfile.set(null);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.loadProfile();
    }
  }

  // 🔄 Cargar perfil desde el backend
  private loadProfile(): void {
    this.usuarioService.getPerfil().subscribe({
      next: (profile) => this.userProfile.set(profile),
      error: (err) => console.error('Error al cargar perfil en drawer:', err)
    });
  }

  // 🔗 Links dinámicos
  profileLink = computed(() => {
    const role = this.authService.getUserRole();
    return role?.toLowerCase() === 'administrador' ? '/admin/perfil' : '/perfil';
  });

  // 🔐 Acciones
  async onSignOut(): Promise<void> {
    if (confirm('¿Seguro que desea cerrar sesión?')) {
      await this.authService.signOut();
      this.closeDrawer.emit();
      this.router.navigate(['/login']);
    }
  }

  // 🏠 Cerrar y navegar
  navigateAndClose(path: string): void {
    this.closeDrawer.emit();
    this.router.navigate([path]);
  }
}
