import { Component, EventEmitter, Input, Output, inject, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconComponent } from '@app/shared/icono/icono';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css'
})
export class Drawer {
  // 🔧 Servicios
  private authService = inject(AuthService);

  // 📥 Inputs (manteniendo compatibilidad)
  @Input() isLoggedIn: boolean | null = false;

  // 📤 Outputs
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() openSearch = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>();

  // 📊 Datos del usuario
  user = this.authService.user;

  // 🔗 Links dinámicos
  get profileLink(): string {
    const role = this.authService.getUserRole();
    return role?.toLowerCase() === 'administrador' ? '/admin/perfil' : '/perfil';
  }
}
