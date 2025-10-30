import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase.config';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  get isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!(localStorage.getItem('jwt_token') || localStorage.getItem('firebase_token'));
    }
    return false;
  }

  async signOut() {
    if (confirm('¿Seguro que desea cerrar sesión?')) {
      try {
        await signOut(auth);
        console.log('🔒 Sesión de Firebase cerrada correctamente.');
      } catch (error) {
        console.error('⚠️ Error al cerrar sesión en Firebase:', error);
      }

      localStorage.removeItem('jwt_token');
      localStorage.removeItem('firebase_token');
      window.location.href = '/login';
    }
  }
}
