import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Drawer } from '../drawer/drawer';
import { AuthService } from '../../services/auth/auth.service';

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

  private authService = inject(AuthService);

  isLoggedIn = this.authService.isAuthenticated;

  get profileLink(): string {
    const role = this.authService.getUserRole();
    return role?.toLowerCase() === 'administrador' ? '/admin/perfil' : '/perfil';
  }

  async signOut() {
    if (confirm('¿Seguro que desea cerrar sesión?')) {
      await this.authService.signOut();
      window.location.href = '/login';
    }
  }

  toggleDrawer() {
    this.drawerOpen = !this.drawerOpen;
  }

  profileMenuOpen = false;

  toggleProfileMenu() {
    if (!this.isLoggedIn()) {
      window.location.href = '/login';
      return;
    }
    this.profileMenuOpen = !this.profileMenuOpen;
  }


  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;

    // Si clickea fuera del menú y del botón
    if (!target.closest('.profile-menu-area')) {
      this.profileMenuOpen = false;
    }
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
