import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase.config';
import { Navbar } from '../navbar/navbar';
import { Drawer } from '../drawer/drawer';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, Navbar, Drawer],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  searchOpen = false;
  drawerOpen = false;

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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

  toggleDrawer() {
    this.drawerOpen = !this.drawerOpen;
  }

  openSearch() {
    this.searchOpen = true;
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 0);
    document.body.classList.add('overflow-hidden');
  }

  closeSearch() {
    this.searchOpen = false;
    document.body.classList.remove('overflow-hidden');
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.searchOpen) this.closeSearch();
  }
}
