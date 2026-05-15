import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

// Components
import { Navbar } from '../navbar/navbar';
import { Drawer } from '../drawer/drawer';


// Services
import { AuthService } from '../../services/auth/auth.service';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { BuscadorComponent } from '@app/shared/buscador/buscador';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    Navbar,
    Drawer,
    BuscadorComponent,
    IconComponent
],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  constructor() {
    // Intentar cargar el perfil si ya está logueado para activar la alerta si es necesario
    if (this.authService.isAuthenticated()) {
      this.usuarioService.getPerfil().subscribe();
    }
  }
  // 🔧 Servicios
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  // 🎯 Signals
  drawerOpen = signal(false);
  profileMenuOpen = signal(false);

  // 📊 Computed
  isLoggedIn = this.authService.isAuthenticated;
  isProfileIncomplete = this.usuarioService.isProfileIncomplete;

  get isAdmin(): boolean {
    return this.authService.getUserRole()?.toLowerCase() === 'administrador';
  }

  // 🏠 Navegación al home
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  // 🔐 Auth
  async signOut(): Promise<void> {
    if (confirm('¿Seguro que desea cerrar sesión?')) {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    }
  }

  // 🎮 UI
  toggleDrawer(): void {
    this.drawerOpen.update((prev) => !prev);
  }

  toggleProfileMenu(): void {
    console.log('🔵 toggleProfileMenu llamado');
    console.log('🔵 isLoggedIn:', this.isLoggedIn());
    console.log('🔵 profileMenuOpen ANTES:', this.profileMenuOpen());

    if (!this.isLoggedIn()) {
      console.log('❌ Usuario no logueado, redirigiendo...');
      this.router.navigate(['/login']);
      return;
    }

    this.profileMenuOpen.update((prev) => {
      console.log('🔵 profileMenuOpen cambió de', prev, 'a', !prev);
      return !prev;
    });

    console.log('🔵 profileMenuOpen DESPUÉS:', this.profileMenuOpen());
  }

  // 🚀 Navegación programática instantánea
  navigateAndClose(route: string): void {
    this.router.navigate([route]);
    this.profileMenuOpen.set(false);
    this.drawerOpen.set(false);
  }

  // 🎧 Host Listeners
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;

    // Cerrar menú de perfil si clickea fuera
    if (!target.closest('.profile-menu-area')) {
      this.profileMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    // El buscador maneja su propio ESC
    // Aquí solo cerramos el menú de perfil si está abierto
    if (this.profileMenuOpen()) {
      this.profileMenuOpen.set(false);
    }
  }
}
