import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private authService = inject(AuthService);

  isLoggedIn = this.authService.isAuthenticated;

  async signOut() {
    if (confirm('¿Seguro que desea cerrar sesión?')) {
      await this.authService.signOut();
      window.location.href = '/login';
    }
  }
}
