import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

import { Header } from '@app/components/header/header';
import { Footer } from '@app/components/footer/footer';
import { UsuarioService } from '@app/services/usuario/usuario.service';
import { AuthService } from '@app/services/auth/auth.service';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, RouterModule, Header, Footer, IconComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit {
  // 🧩 Servicios
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // 🎯 Signals reactivos
  esRutaPerfil = signal(false);

  // 📊 Computed: Mostrar banner si está logueado, perfil incompleto cargado y no está en la página /perfil
  mostrarBannerPerfilIncompleto = computed(() => {
    const autenticado = this.authService.isAuthenticated();
    const perfilCargado = this.usuarioService.perfilUsuario() !== null;
    const completo = this.usuarioService.perfilCompleto();
    const enPerfil = this.esRutaPerfil();

    return autenticado && perfilCargado && !completo && !enPerfil;
  });

  constructor() {
    // ⚡ Precargar perfil proactivamente en segundo plano al autenticarse
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.usuarioService.getPerfil().subscribe({
          error: (err) => console.error('Error al precargar perfil en layout principal:', err)
        });
      }
    });
  }

  ngOnInit(): void {
    // 🛰️ Detectar si estamos en la ruta /perfil para ocultar el banner preventivo
    this.esRutaPerfil.set(this.router.url === '/perfil');

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.esRutaPerfil.set(url === '/perfil' || url.startsWith('/perfil?'));
    });
  }
}
