import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, combineLatest } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  tap,
} from 'rxjs/operators';
import { of } from 'rxjs';

// Components
import { Navbar } from '../navbar/navbar';
import { Drawer } from '../drawer/drawer';

// Services
import { AuthService } from '../../services/auth/auth.service';
import { ProductosService } from '@app/services/producto/producto.service';
import { PaquetePublicadoService } from '@app/services/paquete/paquete-publicado.service';

// Models
import { Producto } from '@app/models/ProductosInterfaces/Producto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

// Tipos
type TipoBusqueda = 'todo' | 'productos' | 'paquetes';

interface ResultadoBusqueda {
  productos: Producto[];
  paquetes: PaquetePublicado[];
  cargando: boolean;
  error: string | null;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, Navbar, Drawer],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  // 🔧 Servicios
  private authService = inject(AuthService);
  private productosService = inject(ProductosService);
  private paquetesService = inject(PaquetePublicadoService);
  private router = inject(Router);

  // 📌 ViewChild
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('searchContainer') searchContainer?: ElementRef<HTMLDivElement>;

  // 🎯 Signals
  drawerOpen = signal(false);
  profileMenuOpen = signal(false);

  // 🔍 Búsqueda
  searchOpen = signal(false);
  mobileSearchOpen = signal(false);
  searchTerm = signal('');
  tipoBusqueda = signal<TipoBusqueda>('todo');
  resultados = signal<ResultadoBusqueda>({
    productos: [],
    paquetes: [],
    cargando: false,
    error: null,
  });

  // 📊 Computed
  isLoggedIn = this.authService.isAuthenticated;

  hayResultados = computed(() => {
    const res = this.resultados();
    return res.productos.length > 0 || res.paquetes.length > 0;
  });

  totalResultados = computed(() => {
    const res = this.resultados();
    return res.productos.length + res.paquetes.length;
  });

  mostrarProductos = computed(() => {
    const tipo = this.tipoBusqueda();
    return tipo === 'todo' || tipo === 'productos';
  });

  mostrarPaquetes = computed(() => {
    const tipo = this.tipoBusqueda();
    return tipo === 'todo' || tipo === 'paquetes';
  });

  get profileLink(): string {
    const role = this.authService.getUserRole();
    return role?.toLowerCase() === 'administrador' ? '/admin/perfil' : '/perfil';
  }

  // 🔍 Subject para búsqueda reactiva
  private searchSubject = new Subject<string>();

  constructor() {
    this.setupSearch();
  }

  // 🔧 Configuración de búsqueda
  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.resultados.update((prev) => ({
            ...prev,
            cargando: true,
            error: null,
          }));
        }),
        switchMap((term) => {
          if (!term.trim()) {
            return of({ productos: [], paquetes: [] });
          }

          // Buscar en paralelo productos y paquetes
          return combineLatest({
            productos: this.productosService.getProductos().pipe(
              catchError(() => of([]))
            ),
            paquetes: this.paquetesService.getPaquetes().pipe(
              catchError(() => of([]))
            ),
          });
        }),
        catchError((error) => {
          console.error('❌ Error en búsqueda:', error);
          this.resultados.update((prev) => ({
            ...prev,
            cargando: false,
            error: 'Error al buscar. Intenta nuevamente.',
          }));
          return of({ productos: [], paquetes: [] });
        })
      )
      .subscribe((data) => {
        const term = this.searchTerm().toLowerCase();

        // Filtrar productos
        const productosFiltrados = data.productos.filter((p) => {
          const nombre = p.nombre?.toLowerCase() || '';
          const descripcion = p.descripcion?.toLowerCase() || '';
          const marca = p.marca?.nombre?.toLowerCase() || '';
          const categoria = p.categoria?.nombre?.toLowerCase() || '';

          return (
            nombre.includes(term) ||
            descripcion.includes(term) ||
            marca.includes(term) ||
            categoria.includes(term)
          );
        });

        // Filtrar paquetes
        const paquetesFiltrados = data.paquetes.filter((paq) => {
          const nombre = paq.paqueteBase?.nombre?.toLowerCase() || '';
          const descripcion = paq.paqueteBase?.descripcion?.toLowerCase() || '';
          const marca = paq.paqueteBase?.marca?.nombre?.toLowerCase() || '';
          const categoria = paq.paqueteBase?.categoria?.nombre?.toLowerCase() || '';

          return (
            nombre.includes(term) ||
            descripcion.includes(term) ||
            marca.includes(term) ||
            categoria.includes(term)
          );
        });

        console.log('✅ Productos filtrados:', productosFiltrados.length);
        console.log('✅ Paquetes filtrados:', paquetesFiltrados.length);

        this.resultados.set({
          productos: productosFiltrados.slice(0, 6),
          paquetes: paquetesFiltrados.slice(0, 6),
          cargando: false,
          error: null,
        });
      });
  }

  // 🔍 Métodos de búsqueda
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.searchSubject.next(term);

    // No cerrar el dropdown automáticamente, mantenerlo abierto
    if (!this.searchOpen()) {
      this.searchOpen.set(true);
    }
  }

  onSearchFocus(): void {
    // Abrir dropdown siempre al hacer focus
    this.searchOpen.set(true);
  }

  onInputClick(event: Event): void {
    // Prevenir que el click cierre el dropdown
    event.stopPropagation();
    this.searchOpen.set(true);
  }

  openSearch(): void {
    this.searchOpen.set(true);
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 100);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
  }

  openSearchMobile(): void {
    this.mobileSearchOpen.set(true);
    setTimeout(() => this.mobileSearchInput?.nativeElement?.focus(), 100);
  }

  closeSearchMobile(): void {
    this.mobileSearchOpen.set(false);
    this.searchTerm.set('');
    this.resultados.set({
      productos: [],
      paquetes: [],
      cargando: false,
      error: null,
    });
  }

  // 🏠 Navegación al home
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  cambiarTipoBusqueda(tipo: TipoBusqueda, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.tipoBusqueda.set(tipo);
  }

  verTodosResultados(): void {
    const term = this.searchTerm();
    if (term.trim()) {
      this.closeSearch();
      this.closeSearchMobile();
      this.router.navigate(['/buscar'], {
        queryParams: { q: term, tipo: this.tipoBusqueda() },
      });
    }
  }

  // 📍 Navegación
  verProducto(producto: Producto): void {
    if (producto.id_producto) {
      this.closeSearch();
      this.closeSearchMobile();
      this.router.navigate(['/detalleSeleccionProducto', producto.id_producto]);
    }
  }

  verPaquete(paquete: PaquetePublicado): void {
    if (paquete.id_paquete_publicado) {
      this.closeSearch();
      this.closeSearchMobile();
      this.router.navigate(['/productos-del-paquete', paquete.id_paquete_publicado]);
    }
  }

  // 🎨 Helpers
  obtenerImagenProducto(producto: Producto): string {
    return producto.imagen_url || '/assets/images/placeholder-product.png';
  }

  obtenerImagenPaquete(paquete: PaquetePublicado): string {
    return (
      paquete.imagen_url ||
      paquete.paqueteBase?.imagen_url ||
      '/assets/images/placeholder-product.png'
    );
  }

  formatearPrecio(precio?: number | null): string {
    if (!precio) return 'Consultar';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(precio);
  }

  truncarTexto(texto: string, maxLength: number): string {
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
  }

  // 🔐 Auth
  async signOut(): Promise<void> {
    if (confirm('¿Seguro que desea cerrar sesión?')) {
      await this.authService.signOut();
      window.location.href = '/login';
    }
  }

  // 🎮 UI
  toggleDrawer(): void {
    this.drawerOpen.update((prev) => !prev);
  }

  toggleProfileMenu(): void {
    if (!this.isLoggedIn()) {
      window.location.href = '/login';
      return;
    }
    this.profileMenuOpen.update((prev) => !prev);
  }

  // 🎧 Host Listeners
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;

    // Cerrar menú de perfil
    if (!target.closest('.profile-menu-area')) {
      this.profileMenuOpen.set(false);
    }

    // Cerrar dropdown de búsqueda si clickea fuera
    const searchContainer = this.searchContainer?.nativeElement;
    if (
      this.searchOpen() &&
      searchContainer &&
      !searchContainer.contains(target)
    ) {
      this.searchOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.searchOpen()) {
      this.closeSearch();
    }
    if (this.mobileSearchOpen()) {
      this.closeSearchMobile();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Ctrl/Cmd + K para abrir búsqueda
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }
}
