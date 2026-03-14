# CONTEXT.md — Mercado Sinérgico Frontend

> **Memoria permanente del proyecto para asistentes de IA.**
> Última actualización: 2026-03-11

---

## 1. STACK TECNOLÓGICO

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Angular | ^20 (zoneless) |
| Lenguaje | TypeScript | ~5.8 |
| Estilos | Tailwind CSS v4 | ^4.1 |
| Iconos | @ng-icons/feather-icons | ^32.5 |
| Toasts | ngx-sonner | ^3.1 |
| Alertas | SweetAlert2 | ^11 |
| Auth | Firebase Auth (Google) + JWT propio | ^12.5 / custom |
| SSR | Angular SSR (@angular/ssr) | ^20 |
| HTTP | Angular HttpClient + Fetch | — |
| Testing | Vitest | ^3 |
| Linting | ESLint + angular-eslint | — |
| Node mínimo | ≥20.19.0 | — |

**Alias de paths (tsconfig)**:
- `@app/*` → `src/app/*`
- `@environments/*` → `src/environments/*`

---

## 2. ARQUITECTURA DEL PROYECTO

```
src/app/
├── app.routes.ts          # Todas las rutas (ver sección 3)
├── app.config.ts          # Providers globales: zoneless, SSR, NgIcons, authInterceptor
├── components/            # Header, Footer, Navbar, Drawer, Carrusel, LocationModal
├── config/
│   └── firebase.config.ts # Inicialización Firebase + export `auth`
├── guards/
│   ├── auth.guard.ts      # Espera restoreSession(), verifica jwt_token o firebase_token
│   └── admin.guard.ts     # Verifica rol === 'Administrador' en payload JWT
├── interceptors/
│   └── auth.interceptor.ts # Agrega Bearer token a todos los requests (excepto /login, /registrarse, /auth, /firebase)
├── layouts/
│   └── main-layout/       # Wrapper: Header + RouterOutlet + Footer + WhatsAppButton
├── models/                # (ver sección 5)
├── modules/
│   └── usuario/pages/perfil/  # Perfil de usuario
├── pages/                 # (ver sección 3.B)
├── services/              # (ver sección 6)
└── shared/                # (ver sección 7)
```

### Convenciones de nombres
- Archivos: `kebab-case.ts` (ej: `paquete-card.ts`)
- Selectores: `app-nombre-componente`
- Clase TS: `PascalCase` sin sufijo `Component` en componentes nuevos (ej: `PaqueteCard`, no `PaqueteCardComponent`)
- Servicios: extienden `ApiService` cuando consumen la API
- Todos los componentes son **standalone: true**
- **NO usar NgModules** — solo standalone components
- **NO usar `*ngIf` / `*ngFor`** — usar `@if` / `@for` (Angular 17+ control flow)
- Cambio de detección: **zoneless** (`provideZonelessChangeDetection()`) — NO usar `ChangeDetectorRef.markForCheck()` como workaround general

---

## 3. RUTAS

### 3.A Layout principal (todos dentro de `MainLayout`)
```
/                          → Home
/login                     → LoginComponent
/registrarse               → RegistrarseComponent
/productos                 → ProductosComponent
/paquetes                  → PaquetesPublicosComponent
/producto/:id              → ProductoDetalleSeleccionComponent
/paquete/:paqueteId/producto/:productoId  → DetalleProductoSumarse
/paquete/:paqueteId/productos             → ProductosDelPaquete
/perfil                    → Perfil  [authGuard]
/mis-pedidos               → MisPedidosComponent  [authGuard]
```

### 3.B Rutas Admin (`/admin`) — [authGuard, adminGuard]
```
/admin/perfil                           → PerfilAdmin
/admin/crear-producto                   → CrearProductoComponent
/admin/crear-paquete                    → CrearPaqueteComponent
/admin/publicar-paquete                 → PublicarPaqueteComponent
/admin/administrar-plantillas           → AdministrarPlantillasComponent
/admin/administrar-productos            → AdministrarProductosComponent
/admin/editar-producto/:id              → EditarProductoComponent
/admin/gestionar-variantes/:id          → GestionarVariantesComponent
/admin/administrar-paquetes             → AdministrarPaquetesComponent
/admin/editar-paquete-base/:id          → EditarPaqueteBaseComponent
/admin/administrar-publicaciones        → AdministrarPublicacionesComponent
/admin/administrar-publicacion/:id      → AdministrarPublicacionDetalleComponent
```

---

## 4. DESIGN SYSTEM

### 4.A Fuentes
- Display: `Righteous` (self-hosted woff2) → `font-display`
- Body: `Poppins` (self-hosted woff2) → `font-body`

### 4.B Variables CSS (`:root`)
```css
/* Primitivos */
--color-celeste: #71A8D9
--color-celeste-dark: #4b87bd
--color-celeste-light: #D9E9F6
--color-azul: #2E608C
--color-azul-light: #E6F0F8
--color-amarillo: #FFD562
--color-amarillo-dark: #D28509
--color-naranja: #E05C00

/* Semánticos de marca */
--brand-primary: #71A8D9    (celeste)
--brand-secondary: #2E608C  (azul oscuro)
--brand-cta: #FFD562        (amarillo — botón principal)
--brand-cta-hover: #D28509

/* Feedback */
--success: #4CAF50  --success-dark: #2E7D32  --success-light: #f0fdf4
--error: #B92905    --error-dark: #8A1F03    --error-light: #fef2f2
--warning: #E05C00  --warning-light: #FFF0E6
--info: #2E608C     --info-light: #eff6ff

/* Status Badges */
--status-active-bg: #f0fdf4    --status-active-text: #166534
--status-pending-bg: #fffbeb   --status-pending-text: #92400e
--status-closed-bg: #fef2f2    --status-closed-text: #991b1b
--status-info-bg: #eff6ff      --status-info-text: #1e40af
--status-neutral-bg: #f3f4f6   --status-neutral-text: #374151
```

### 4.C Clases CSS globales (`styles.css`)
```css
.page-container  → min-h-screen bg-bg-app font-body
.page-content    → max-w-7xl mx-auto px-4 py-8
.page-header     → text-center mb-8 sm:mb-10 lg:mb-12
.page-title      → font-display text-3xl...6xl font-bold text-text-primary
.page-subtitle   → text-sm...lg text-text-secondary max-w-2xl mx-auto
.page-layout     → flex flex-col lg:flex-row gap-6
```

### 4.D Tailwind — tokens disponibles como clases
Los tokens de CSS se mapean en `@theme` a clases Tailwind:
- `bg-brand-primary`, `text-brand-secondary`, `bg-brand-cta`
- `bg-status-active-bg`, `text-status-active-text`, etc.
- `bg-bg-app`, `bg-bg-surface`, `bg-bg-raised`
- `text-text-primary`, `text-text-secondary`, `text-text-muted`
- `font-display`, `font-body`

---

## 5. MODELOS DE DATOS (Interfaces TypeScript)

### 5.A Enums
```typescript
// src/app/models/Enums.ts
export enum EstadoPaquete {
  ABIERTO = 'Abierto', CERRADO = 'Cerrado', CANCELADO = 'Cancelado',
  INCOMPLETO = 'Incompleto', PENDIENTE = 'Pendiente',
}
export enum TipoPaquete {
  SINERGICO = 'SINERGICO', ENERGICO = 'Enérgico', POR_DEFINIR = 'POR_DEFINIR',
}

// src/app/models/PaquetesInterfaces/EstadoPaquetePublicado.ts
export enum EstadoPaqueteNombre {
  Pendiente = 'Pendiente', Activo = 'Activo', EnPreparacion = 'En Preparación',
  Finalizado = 'Finalizado', Cancelado = 'Cancelado', Eliminado = 'Eliminado',
}
```

### 5.B Interfaces de Paquetes
```typescript
interface PaqueteBase {
  id_paquete_base?: number;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  categoria_id: number;
  marcaId?: number;
  marca?: Marca;
  categoria?: Categoria;
  productos?: PaqueteBaseProducto[];
}

interface PaquetePublicado {
  id_paquete_publicado?: number;
  paqueteBaseId: number;
  estadoId: number;
  zonaId: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  cant_productos?: number;
  cant_productos_reservados?: number;
  cant_usuarios_registrados?: number;
  monto_total?: number;
  descuento?: number;
  imagen_url?: string;
  tipoPaquete?: TipoPaquete;
  // Relaciones
  paqueteBase?: PaqueteBase;
  estado: EstadoPaquetePublicado;
  zona?: Zona;
  pedidos?: Pedido[];
}

interface EstadoPaquetePublicado {
  id_estado: number;
  nombre: string;
  paquetes?: PaquetePublicado[];
}

interface PaqueteBaseProducto {
  id: number;
  productoId: number;
  paqueteBaseId: number;
  producto?: Producto;
  paqueteBase?: PaqueteBase;
}
```

### 5.C Interfaces de Productos
```typescript
interface Producto {
  id_producto?: number;
  id?: number;           // Fallback de compatibilidad con backend
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_url?: string;
  imagen?: string;
  marca_id: number;
  altura?: number; ancho?: number; profundidad?: number; peso?: number;
  stock?: number;
  plantillaId?: number;
  categoria_id: number;
  tieneVariantes?: boolean;
  cantidadVariantes?: number;
  tipo: TipoPaquete;
  // Relaciones
  marca?: string | { id_marca?: number; nombre: string };
  categoria?: string | { id_categoria?: number; nombre: string };
  plantilla?: Plantilla;
  paquetes?: PaqueteBaseProducto[];
  imagenes: Imagen[];     // SIEMPRE presente (array vacío si no hay)
  variantes?: ProductoVariante[];
}

interface Imagen { id: number; url: string; producto_id: number; }
```

### 5.D Interfaces de Pedidos
```typescript
interface Pedido {
  id_pedido?: number;
  usuarioId: number;
  paquetePublicadoId: number;
  estadoId: number;
  monto_total?: number;
  descuento_aplicado?: number | null;
  fecha?: Date;
  // Relaciones
  usuario?: Usuario;
  paquetePublicado?: PaquetePublicado;
  estado?: EstadoPedido;
  pedidoProductos?: PedidoProducto[];
  detalles?: PedidoDetalle[];
}

interface PedidoProducto {
  id_pedido_producto?: number;
  pedidoId: number;
  productoId: number;
  cantidad: number;
  variante?: string;
  producto?: Producto;
}

interface PedidoDetalle {
  id: number; pedidoId: number; productoId: number;
  cantidad: number; precio_unitario: number; subtotal: number;
  variante?: string;
  producto: Producto;
}

interface EstadoPedido { id_estado: number; nombre: string; pedidos?: Pedido[]; }
// IDs de estado pedido: 1=Pendiente, 2=En proceso, 3=Aprobado/Pagado, 4=Cancelado

interface ProductoEnPedido {
  id_detalle: number; id_producto: number; nombre: string;
  precio: number; precioConDescuento?: number;
  imagen_url?: string; cantidad: number; variante?: string | null;
}
```

### 5.E Interfaces de Usuario
```typescript
interface Usuario {
  id?: number;
  email: string; nombre: string;
  contraseña?: string;  // NUNCA viene del backend
  telefono: string; fecha_nac?: Date; imagen_url?: string;
  rolId: number;
  rol?: Rol;
  direccion?: Direccion;
  pedidos?: Pedido[];
}
interface Rol { id: number; nombre: string; usuarios?: Usuario[]; }
```

### 5.F Interfaces de Plantillas y Variantes
```typescript
interface Plantilla { id?: number; nombre: string; caracteristicas: Caracteristica[]; }
interface Caracteristica { id?: number; nombre: string; plantillaId?: number; opciones: Opcion[]; }
interface Opcion { id?: number; nombre: string; }

interface ProductoVariante {
  id: number; sku?: string;
  stockFisico: number | null;  // null = sinérgico (ilimitado)
  precioExtra?: number; activo: boolean;
  imagen_url?: string | null;
  opciones: VarianteOpcion[];
  paquetesActivos?: PaqueteDisponible[];
}
interface VarianteOpcion {
  caracteristica: string; opcion: string;
  caracteristicaId: number; opcionId: number;
}
interface ProductoVariantesResponse {
  producto: ProductoVarianteInfo;
  variantes: ProductoVariante[];
}
```

### 5.G Interfaces de Zonas
```typescript
interface Zona { id_zona: number; nombre: string; paquetes?: PaquetePublicado[]; localidades?: Localidad[]; }
interface Localidad { id_localidad: number; nombre: string; codigo_postal: number; direcciones?: Direccion[]; zonas?: Zona[]; }
interface Direccion {
  id?: number; usuarioId: number; localidadId: number;
  codigo_postal: number; calle: string; numero: number;
  piso?: number; departamento?: string;
  usuario?: Usuario; localidad?: Localidad;
}
```

### 5.H DTOs
```typescript
interface SumarseAPedidoDTO { productoId: number; cantidad: number; varianteId?: number | null; }
interface CreatePaqueteBaseDto { nombre: string; descripcion: string; imagen_url?: string; categoria_id: number; marcaId?: number; }
interface CrearProductoDTO { nombre: string; descripcion: string; precio: number; imagen_url?: string; marca_id: number; altura?: number; ancho?: number; profundidad?: number; peso?: number; stock?: number; plantillaId?: number; categoria_id: number; }
interface CrearUsuarioDTO { email: string; nombre: string; contraseña: string; telefono: string; fecha_nac?: Date; imagen_url?: string; rolId: number; }
interface LoginResponse { token: string; usuario?: Usuario; }
interface FirebaseLoginResponse { token: string; usuario: { id: string; email: string; nombre: string; rol: { nombre: string; } } }
interface ActualizarVarianteDTO { sku?: string; stockFisico?: number | null; precioExtra?: number; activo?: boolean; }
interface GenerarVariantesDTO { productoId: number; opcionesDisponibles: Record<string, number[]>; }
interface VariantesSeleccionadas { [caracteristicaId: number]: number; }
```

---

## 6. SERVICIOS DEL FRONTEND

### 6.A `ApiService` (base)
**Path**: `src/app/services/api.service.ts`
**Todos los servicios de dominio extienden esta clase.**
```typescript
class ApiService {
  protected buildUrl(path: string): string  // Prefija environment.apiUrl
  get<T>(path: string): Observable<T>
  post<T>(path: string, body: any): Observable<T>
  put<T>(path: string, body: any): Observable<T>
  patch<T>(path: string, body: any): Observable<T>
  patchFormData<T>(path: string, formData: FormData): Observable<T>  // Sin Content-Type manual
  delete<T>(path: string): Observable<T>
}
// Base URL: environment.apiUrl = 'http://localhost:3000/api'
```

### 6.B `AuthService`
**Path**: `src/app/services/auth/auth.service.ts`
```typescript
class AuthService {
  isAuthenticated = computed(...)           // Signal booleano
  get user(): Signal<User | null>          // Firebase User
  setJwtToken(token: string): void         // Guarda en localStorage['jwt_token']
  getJwtToken(): string | null
  clearJwtToken(): void
  setFirebaseToken(token: string): void    // Guarda en localStorage['firebase_token']
  getFirebaseToken(): string | null
  clearFirebaseToken(): void
  clearTokens(): void
  async signInWithGoogle(): Promise<User>  // Login Google via Firebase popup
  async signOut(): Promise<void>
  getCurrentUser(): User | null
  getUserRole(): string | null             // Decodifica JWT, devuelve payload.rol
  async restoreSession(): Promise<void>    // Llamado en APP_INITIALIZER
  async waitForSessionReady(): Promise<void>
  isSessionReady(): boolean
}
// ⚠️ No usar localStorage directamente en components. Usar AuthService.
```

### 6.C `ToastService`
**Path**: `src/app/services/toast/toast.service.ts`
```typescript
class ToastService {
  success(message: string, title?: string): void  // Verde, 3s
  error(message: string, title?: string): void    // Rojo, 4s
  warning(message: string, title?: string): void  // Naranja, 3.5s
  info(message: string, title?: string): void     // Azul, 3s
  loading(message: string): void
  dismiss(toastId?: string | number): void
  clear(): void
}
// Uso: this.toast.success('Guardado correctamente')
// Uso con título: this.toast.error('Detalle del error', 'Título')
// NOTA: cuando se pasa title, el title va en la cabecera y message en descripción
```

### 6.D `PaquetePublicadoService`
**Path**: `src/app/services/paquete/paquete-publicado.service.ts`
Extiende `ApiService`. Endpoint base: `paquetes-publicados`
```typescript
getPaquetes(): Observable<PaquetePublicado[]>
getPaqueteById(id: number): Observable<PaquetePublicado>
createPaquete(paquete: PaquetePublicado): Observable<PaquetePublicado>
updatePaquete(paquete: PaquetePublicado): Observable<PaquetePublicado>
deletePaquete(id: number): Observable<PaquetePublicado>
getPaquetesPorCerrarse(): Observable<PaquetePublicado[]>   // GET /por-cerrarse
getRelacionados(id: number): Observable<PaquetePublicado[]>// GET /relacionados/:id
getPaquetesDelUsuario(): Observable<PaquetePublicado[]>    // GET /mis-pedidos
getByProductId(productoId: number): Observable<PaquetePublicado[]>
getAllPaquetes(): Observable<PaquetePublicado[]>
confirmarCompra(id: number): Observable<{ message: string }> // POST /:id/confirmar
duplicarPaquete(id: number): Observable<PaquetePublicado>  // POST /:id/duplicar
completarPaquete(id: number): Observable<PaquetePublicado> // POST /:id/completar
cancelarPaquete(id: number): Observable<PaquetePublicado>  // POST /:id/cancelar
cerrarPaquete(id: number): Observable<PaquetePublicado>    // POST /:id/cerrar → EN PREPARACION
notificarCompradores(id: number): Observable<{ mensaje: string; notificados: number }> // POST /:id/notificar
// ⚠️ notificarCompradores usa this.http directo (no buildUrl) — BUG conocido, endpoint completo debe ser pasado
```

### 6.E `PaqueteBaseService`
**Path**: `src/app/services/paquete/paquete-base.service.ts`
Extiende `ApiService`. Endpoint base: `paquetes-base`
```typescript
createPaquete(data: FormData): Observable<PaqueteBase>             // POST (multipart)
updatePaquete(paquete: PaqueteBase): Observable<PaqueteBase>       // PUT /:id
deletePaquete(id: number): Observable<PaqueteBase>
agregarProductos(paqueteBaseId: number, productosId: number[]): Observable<PaqueteBase>  // POST /:id/productos
getPaquetes(): Observable<PaqueteBase[]>
getProductosByPaqueteBase(paqueteBaseId: number): Observable<Producto[]>
duplicarPaquete(id: number): Observable<PaqueteBase>               // POST /:id/duplicar
// Todos con timeout(60000) y catchError
```

### 6.F `ProductosService`
**Path**: `src/app/services/producto/producto.service.ts`
Extiende `ApiService`. Tiene caché interno con `shareReplay(1)`.
```typescript
getProductos(): Observable<Producto[]>           // Con caché. Llama a clearCache() si falla.
clearCache(): void
getProductoById(id: number): Observable<Producto>
getProductoDetalle(id: number): Observable<ProductoDetalleDTO>
createProduct(data: FormData): Observable<Producto>        // Limpia caché al crear
duplicateProduct(id: number): Observable<Producto>
updateProducto(productoId: number, data: FormData): Observable<Producto>  // PUT con FormData
deleteProducto(id: number): Observable<any>
getProductosFiltrados(search: string, offset: number, limit: number): Observable<Producto[]>
// normalizeProducto(): método privado que estandariza imagen_url, imagenes[], marca y categoria
```

### 6.G `PedidoService`
**Path**: `src/app/services/pedido/pedido.service.ts`
Extiende `ApiService`. Endpoint base: `pedidos`
```typescript
getPedidos(): Observable<Pedido[]>
getPedidoById(id: number): Observable<Pedido>
crearPedido(paqueteId: number, body: Partial<Pedido>): Observable<Pedido>
actualizarCantidad(pedidoId: number, detalleId: number, body: { cantidad: number }): Observable<PedidoActualizado>
eliminarProductoDelPedido(pedidoId: number, detalleId: number): Observable<void>
sumarseAlPaquete(paqueteId: number, body: SumarseAPedidoDTO): Observable<Pedido>  // POST /pedidos/:paqueteId
salirDelPaquete(paqueteId: number): Observable<void>   // DELETE /pedidos/:paqueteId/bajarse
iniciarCheckout(pedidoId: number): Observable<any>     // POST /pedidos/:id/checkout
```

### 6.H `UsuarioService`
**Path**: `src/app/services/usuario/usuario.service.ts`
Extiende `ApiService`.
```typescript
getUsuarios(): Observable<Usuario[]>
register(usuario: CrearUsuarioDTO): Observable<Usuario>              // POST /usuarios/registrar
login(credenciales: { email: string; contraseña: string }): Observable<LoginResponse>  // Guarda JWT
loginWithFirebase(firebaseToken: string): Observable<FirebaseLoginResponse>
getPerfil(): Observable<Usuario>                                     // GET /usuarios/me
updatePerfil(data: any): Observable<Usuario>                         // PATCH /usuarios/me
uploadImagenPerfil(file: File): Observable<Usuario>                  // PATCH /usuarios/me (FormData)
registrarDireccion(userId: number, direccion: Direccion): Observable<Usuario>
buscarPorEmail(email: string): Observable<Usuario>
```

### 6.I `VarianteService`
**Path**: `src/app/services/variantes/variante.service.ts`
Extiende `ApiService`.
```typescript
getVariantesByProducto(productoId: number): Observable<ProductoVariantesResponse>
generarVariantes(data: GenerarVariantesDTO): Observable<any>       // POST /productos/:id/generar-variantes
actualizarStockBulk(productoId: number, data: ActualizarStockVariantesDTO): Observable<any>
actualizarVariante(varianteId: number, data: ActualizarVarianteDTO, imagenFile?: File | null): Observable<ProductoVariante>
eliminarVariante(varianteId: number): Observable<any>
getStockGlobal(productoId: number): Observable<StockGlobalResponse>
// Helpers:
getVarianteDescripcion(variante: ProductoVariante): string  // "Negro - Talle M"
calcularPrecioFinal(precioBase: number, variante: ProductoVariante): number
tieneStockDisponible(variante: ProductoVariante): boolean   // null = SINERGICO = true
getVariantesDisponibles(variantes: ProductoVariante[]): ProductoVariante[]
agruparPorCaracteristica(variantes: ProductoVariante[]): Map<string, Set<string>>
encontrarVariantePorOpciones(variantes, opcionesSeleccionadas: Record<string, string>): ProductoVariante | undefined
```

### 6.J Otros servicios
```typescript
// PlantillaService (plantillas)
getPlantillas(): Observable<Plantilla[]>
getPlantillaById(id: number): Observable<Plantilla>
crearPlantilla(plantilla: Plantilla): Observable<Plantilla>
actualizarPlantilla(plantilla: Plantilla): Observable<Plantilla>
eliminarPlantilla(id: number): Observable<void>
asignarPlantillaAProducto(plantillaId: number, productoId: number): Observable<Plantilla>

// ZonaService
getZonas(): Observable<Zona[]>
getZonaById(id: number): Observable<Zona>
createZona(zona: Zona): Observable<Zona>
updateZona(id: number, zona: Zona): Observable<Zona>
deleteZona(id: number): Observable<void>
asignarZonaAProducto(zonaId: number, productoId: number): Observable<Zona>
// ⚠️ ZonaService NO extiende ApiService — usa HttpClient directamente

// CategoriaService (extiende ApiService)
getCategorias(): Observable<Categoria[]>
getCategoriaById(id: number): Observable<Categoria>

// MarcaService: similar a categorías
```

---

## 7. COMPONENTES COMPARTIDOS (src/app/shared/)

### 7.A `app-button` — `ButtonComponent`
```html
<app-button
  [variant]="'primary'"        <!-- primary|secondary|tertiary|warning|danger|success|info|ghost -->
  [size]="'md'"                <!-- xs|sm|md|lg|xl|2xl -->
  [shape]="'rounded'"          <!-- rounded|square|circle|pill -->
  [label]="'Guardar'"
  [loading]="isLoading"
  [disabled]="false"
  [iconStart]="'save'"         <!-- nombre de ng-icon SIN prefijo feather -->
  [iconEnd]="'arrowRight'"
  [iconOnly]="false"
  [fullWidth]="false"
  (buttonClick)="onSave()"
/>
<!-- ✅ Uso mínimo: -->
<app-button label="Aceptar" (buttonClick)="confirmar()" />
<!-- Usa signal inputs internamente. Colores: primary=amarillo, secondary=celeste, danger=rojo, info=azul -->
```

### 7.B `app-icon` — `IconComponent`
```html
<app-icon name="search" />
<app-icon name="chevronRight" [size]="'20'" class="text-blue-500" />
<!-- name: nombre feather SIN prefijo (ej: 'search', no 'featherSearch') -->
<!-- Si ya tiene prefijo 'feather', lo pasa directo -->
<!-- Inputs: name(required), size='24', strokeWidth='2', color='currentColor', cssClass='' -->
```

### 7.C `app-paquete-card` — `PaqueteCard`
```html
<app-paquete-card [paquete]="paquete" (cardClick)="onCardClick($event)" />
<!-- @Input paquete: PaquetePublicado (required) -->
<!-- @Output cardClick: EventEmitter<number> (emite id_paquete_publicado) -->
<!-- Computed internas: stockDisponible, porcentajeReservado, descuentoCalculado, esUrgente, esAviso -->
```

### 7.D `app-admin-paquete-card` — `AdminPaqueteCard`
```html
<app-admin-paquete-card
  [paquete]="paquete"
  (close)="onClose($event)"
  (finalize)="onFinalize($event)"
  (refund)="onRefund($event)"
  (notify)="onNotify($event)"
  (duplicate)="onDuplicate($event)"
  (viewDetail)="onVerDetalle($event)"
/>
<!-- Getters de estado: esActivo, esPendiente, esEnPreparacion, esFinalizado, esCancelado -->
<!-- Getters de permisos: canNotify (solo Activo), canClose (solo Activo), canCancel (solo Activo),
     canFinalize (solo EnPreparacion), canDuplicate (siempre) -->
<!-- Tiene menú desplegable con dropdown-menu-container class -->
```

### 7.E `app-producto-card` — `ProductoCard`
```html
<app-producto-card
  [producto]="producto"
  [contexto]="'paquete-detalle'"    <!-- 'productos'|'paquete-detalle'|'seleccion' -->
  [navegacion]="'detalle-sumarse'"  <!-- 'detalle-seleccion'|'detalle-sumarse' -->
  [paqueteId]="paqueteId"           <!-- requerido si navegacion='detalle-sumarse' -->
  [descuento]="{porcentaje: 15, aplicado: false}"
  (cardClick)="onCardClick($event)"
/>
```

### 7.F `app-paquete-banner` — `PaqueteBannerComponent`
```html
<app-paquete-banner [paquete]="paquete()" />
<!-- Computed: imagenUrl, nombrePaquete, descripcionPaquete, estadoNombre,
     zonaNombre, categoriaNombre, marcaNombre, tipoPaquete, tiempoRestante,
     stockDisponible, porcentajeDisponible, esUrgente -->
```

### 7.G `app-paquete-usuario-card` — `PaqueteUsuarioCardComponent`
```html
<app-paquete-usuario-card
  [pedido]="pedido"
  (toggleExpansion)="toggle()"
  (aumentarCantidad)="aumentar($event)"
  (disminuirCantidad)="disminuir($event)"
  (eliminarProducto)="eliminar($event)"
  (salirDelPaquete)="salir()"
  (finalizarCompra)="finalizar()"
/>
<!-- Getter paquete → pedido.paquetePublicado -->
<!-- Getter productosEnPedido → pedido.productosSeleccionados -->
<!-- puedeEditarCantidades: solo si estado.nombre === 'pendiente' -->
```

### 7.H `app-input` — `InputComponent`
Implementa `ControlValueAccessor`. **Inputs via setters** (no signal inputs directos):
```html
<app-input
  [labelValue]="'Nombre'"
  [placeholderValue]="'Ingresá el nombre'"
  [typeValue]="'text'"       <!-- text|email|password|number|tel|date|url -->
  [sizeValue]="'md'"         <!-- sm|md|lg -->
  [requiredValue]="true"
  [clearableValue]="true"
  [prefixValue]="'$'"
  (valueChange)="onValueChange($event)"
/>
<!-- Compatible con ReactiveForms: [formControlName] o [formControl] -->
```

### 7.I `app-select` — `SelectComponent`
Implementa `ControlValueAccessor`. Dropdown custom con búsqueda.
```html
<app-select
  [labelValue]="'Zona'"
  [optionsValue]="[{value: 1, label: 'AMBA'}, {value: 2, label: 'Córdoba'}]"
  [placeholderValue]="'Seleccioná una zona'"
  [searchableValue]="true"
  [clearableValue]="true"
  (valueChange)="onZonaChange($event)"
/>
<!-- SelectOption: { value: any, label: string, disabled?: boolean, group?: string } -->
<!-- SelectGroup: { label: string, options: SelectOption[] } -->
<!-- ⚠️ Internamente convierte value a Number(). Usar IDs numéricos. -->
```

### 7.J `app-textarea` — `TextareaComponent`
Implementa `ControlValueAccessor`.
```html
<app-textarea
  [labelValue]="'Descripción'"
  [rowsValue]="4"
  [maxLengthValue]="500"
  [showCounterValue]="true"
  [autoResizeValue]="true"
  (valueChange)="onDescChange($event)"
/>
```

### 7.K `app-checkbox` — `CheckboxComponent`
Implementa `ControlValueAccessor`. Variantes: `default|chip|switch|card`
```html
<app-checkbox [labelValue]="'Aceptar términos'" [variantValue]="'switch'" />
```

### 7.L `app-selector-variantes` — `SelectorVariantesComponent`
```html
<app-selector-variantes
  [producto]="producto()"
  [habilitado]="true"
  (variantesChange)="onVariantesChange($event)"    <!-- VariantesSeleccionadas -->
  (valido)="onValidoChange($event)"                <!-- boolean -->
  (varianteSeleccionada)="onVarianteId($event)"    <!-- number | null -->
/>
<!-- Requiere que producto.plantilla.caracteristicas esté cargado -->
<!-- Internamente valida combinabilidad contra producto.variantes[] -->
```

### 7.M `app-visor-imagenes` — `VisorImagenesComponent`
```html
<app-visor-imagenes [producto]="producto" [altText]="'Imagen alternativa'" />
<!-- Gestiona galería con thumbnails. Prioriza imagen_url, luego imagenes[] -->
```

### 7.N `app-delayed-skeleton` — `DelayedSkeleton`
```html
<app-delayed-skeleton [isLoading]="loading()" [delay]="200">
  <div skeleton><!-- placeholder shimmer --></div>
  <!-- contenido real cuando isLoading=false -->
</app-delayed-skeleton>
```

### 7.O `app-error-state` — `ErrorState`
```html
<app-error-state
  titulo="Error al cargar"
  mensaje="No se pudo obtener la información."
  [mostrarBoton]="true"
  textoBoton="Reintentar"
  (reintentar)="recargar()"
/>
```

### 7.P `app-buscador-header` — `BuscadorComponent`
```html
<app-buscador-header variant="desktop" (resultadoSeleccionado)="cerrarMenu()" />
<app-buscador-header variant="mobile" />
<!-- Búsqueda en tiempo real con debounce 300ms, filtra productos y paquetes -->
```

### 7.Q `app-info-paquete` — `InfoPaqueteComponent`
```html
<app-info-paquete [paquete]="paquete" />
<!-- Muestra tiempo restante, estado con colores de tokens CSS -->
```

### 7.R `statusColor` — Pipe
```html
{{ estado | statusColor }}
<!-- Devuelve clase CSS: 'text-primary', 'text-blue-600', 'text-red-500', etc. -->
<!-- Valores: 'Abierto', 'Pendiente', 'En Preparación', 'Enviado', 'Entregado', 'Cancelado', 'Cerrado', 'Completo' -->
```

---

## 8. INTEGRACIONES EXTERNAS

### 8.A Firebase Auth
- Config: `src/app/config/firebase.config.ts`
- Export principal: `auth` (instancia Firebase Auth)
- Proyecto: `sinergia-comercial-341ec`
- Solo se inicializa `analytics` en browser (SSR-safe)
- Flujo Google Login:
  1. `AuthService.signInWithGoogle()` → `signInWithPopup` → obtiene ID token Firebase
  2. `UsuarioService.loginWithFirebase(firebaseToken)` → POST `/login/firebase` → devuelve JWT propio
  3. JWT propio se guarda en `localStorage['jwt_token']`

### 8.B Interceptor de Auth
- Archivo: `src/app/interceptors/auth.interceptor.ts`
- Agrega `Authorization: Bearer <token>` a todos los requests
- URLs públicas (sin token): `/login`, `/registrarse`, `/auth`, `/firebase`
- Prioriza JWT propio; si no hay, usa Firebase token
- En error 401: limpia tokens y redirige a `/login`

### 8.C Toast (ngx-sonner)
- Configurado con estilos custom en `styles.css` para tipos: success, error, warning, info, loading
- Font: `var(--font-body)` (Poppins)
- Usar siempre vía `ToastService`, nunca `toast` de ngx-sonner directamente

### 8.D SweetAlert2
- Import directo: `import Swal from 'sweetalert2'`
- Usado en acciones destructivas/irreversibles del admin (cerrar, cancelar, finalizar, notificar)
- Patrón estándar:
```typescript
Swal.fire({ title: '¿Acción?', html: '...', icon: 'warning', showCancelButton: true,
  confirmButtonText: 'Sí', cancelButtonText: 'Cancelar'
}).then(result => { if (result.isConfirmed) { /* ejecutar acción */ } });
```

### 8.E Cloudinary
- Las imágenes se suben al backend, que las sube a Cloudinary
- El frontend solo recibe/muestra URLs de Cloudinary
- Para upload: usar `FormData` con campo `imagen`
- NUNCA subir a Cloudinary directamente desde el frontend

### 8.F NgIcons (Feather)
- Provider: `NgIconsModule.withIcons({...})` en `app.config.ts`
- Uso: `<app-icon name="search" />` (wrapper simplificado)
- El wrapper agrega prefijo `feather` automáticamente
- Iconos disponibles: todos los registrados en `app.config.ts` (ver lista completa)

---

## 9. FLUJOS IMPORTANTES

### 9.A Ciclo de vida de un PaquetePublicado (estados)
```
Pendiente → Activo → En Preparación → Finalizado
                ↓
            Cancelado (desde Activo)
```
- **Pendiente**: recién creado, aún no publicado
- **Activo**: publicado, recibe pedidos
- **En Preparación**: cerrado (manual o automático), no recibe más pedidos
- **Finalizado**: confirmado con proveedor, proceso terminado
- **Cancelado**: cancelado con reembolso a compradores

### 9.B Acciones Admin por estado
| Estado | Notificar | Cerrar | Cancelar | Finalizar | Duplicar |
|--------|-----------|--------|----------|-----------|---------|
| Activo | ✅ | ✅ | ✅ | ❌ | ✅ |
| En Preparación | ❌ | ❌ | ❌ | ✅ | ✅ |
| Finalizado | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cancelado | ❌ | ❌ | ❌ | ❌ | ✅ |

### 9.C Flujo de compra (usuario)
1. Usuario ve `/paquetes` → `app-paquete-card`
2. Navega a `/paquete/:id/productos` → ve lista de productos
3. Hace click → `/paquete/:paqueteId/producto/:productoId` → `DetalleProductoSumarse`
4. Selecciona variantes con `app-selector-variantes`
5. Llama a `PedidoService.sumarseAlPaquete(paqueteId, { productoId, cantidad, varianteId })`
6. Ve su pedido en `/mis-pedidos` → `app-paquete-usuario-card`

### 9.D Flujo de creación de Producto (admin)
1. `/admin/crear-producto` → formulario con `FormData`
2. `ProductosService.createProduct(formData)` → limpia caché
3. `/admin/gestionar-variantes/:id` → `GestionarVariantesComponent`
4. Asignar plantilla → generar variantes con `VarianteService.generarVariantes(dto)`

### 9.E Flujo de publicación de Paquete (admin)
1. `/admin/crear-paquete` → `PaqueteBaseService.createPaquete(FormData)`
2. Agregar productos → `PaqueteBaseService.agregarProductos(id, productosId[])`
3. `/admin/publicar-paquete` → `PaquetePublicadoService.createPaquete(paquetePublicado)`
4. Gestión desde `/admin/administrar-publicacion/:id`

### 9.F Generación de Reportes CSV (Admin)
Desde `AdministrarPublicacionDetalleComponent`:
- **Reporte Proveedor**: productos consolidados de pedidos `estadoId === 3`
- **Reporte Logística**: lista de compradores con detalle
- Formato CSV con `sep=;` para compatibilidad Excel en español
- Usa BOM (`\uFEFF`) para encoding correcto en Excel

### 9.G Normalización de Producto (backend → frontend)
`ProductosService.normalizeProducto()` estandariza:
- `imagenes`: puede llegar como `string[]` u objeto `{ url, id, ... }` — siempre queda `{ url, id, producto_id }`
- `imagen_url`: busca en `producto.imagen_url` → `producto.imagen` → `imagenes[0]?.url`
- `marca`: si es string, lo convierte a `{ nombre: string }` 
- `categoria`: ídem que marca
- `id_producto`: usa `producto.id_producto ?? producto.id`

---

## 10. CONVENCIONES Y REGLAS

### 10.A ✅ OBLIGATORIO
- **Standalone components**: `standalone: true` en TODOS los componentes
- **Control flow moderno**: `@if` / `@for` / `@switch` — NUNCA `*ngIf` / `*ngFor`
- **Signal inputs para componentes nuevos**: `input<T>()` y `output<void>()`
- **ToastService** para notificaciones simples
- **SweetAlert2** para confirmaciones destructivas
- **ApiService** como base para todos los servicios de dominio
- **Operador de navegación segura** en templates: usar `?.` para evitar errores con datos opcionales
- **Mover lógica compleja del template al .ts**: arrow functions con parámetros en template causan error de compilación
- **Precios en ARS**: usar `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })`
- **Fechas en es-AR**: usar `toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })`

### 10.B ❌ PROHIBIDO
- `*ngIf`, `*ngFor`, `*ngSwitch` — usar control flow moderno
- `NgModules` — solo standalone
- `localStorage` directamente en componentes — usar `AuthService`
- Subir imágenes directamente a Cloudinary desde el frontend
- Hardcodear URLs de API — usar `ApiService.buildUrl()` o los servicios
- `Content-Type: multipart/form-data` manual al usar FormData — Angular lo detecta automáticamente
- `ChangeDetectorRef.markForCheck()` como workaround — el proyecto es zoneless

### 10.C Patrones para estados de carga
```typescript
// En el componente
loading = signal(true);
error = signal<string | null>(null);
data = signal<T | null>(null);

// Al cargar
this.service.getAlgo().subscribe({
  next: (d) => { this.data.set(d); this.loading.set(false); },
  error: () => { this.error.set('Mensaje de error'); this.loading.set(false); }
});
```

```html
@if (loading()) {
  <app-delayed-skeleton [isLoading]="true">
    <div skeleton><!-- skeleton UI --></div>
  </app-delayed-skeleton>
} @else if (error()) {
  <app-error-state [mensaje]="error()!" (reintentar)="cargar()" />
} @else {
  <!-- contenido real -->
}
```

---

## 11. PREGUNTAS FRECUENTES DEL DEV

**P: ¿Cómo mostro un toast de éxito?**
```typescript
private toast = inject(ToastService);
this.toast.success('Producto guardado');
this.toast.error('Detalle del error', 'Título del error'); // con título
```

**P: ¿Cómo uso SweetAlert para confirmar acción destructiva?**
```typescript
import Swal from 'sweetalert2';
Swal.fire({ title: '¿Cancelar?', text: 'Acción irreversible', icon: 'error',
  showCancelButton: true, confirmButtonText: 'Sí, cancelar', cancelButtonText: 'Volver'
}).then(r => { if (r.isConfirmed) { /* acción */ } });
```

**P: ¿Cómo subo una imagen?**
```typescript
const formData = new FormData();
formData.append('imagen', file);  // campo 'imagen' siempre
this.productosService.updateProducto(id, formData).subscribe(...);
// NO setear Content-Type manual
```

**P: ¿Cómo verifico el estado de un paquete en template?**
```typescript
// En el .ts (computed):
esActivo = computed(() => this.paquete()?.estado?.nombre?.toLowerCase().trim() === 'activo');
```
```html
@if (esActivo()) { <app-button label="Cerrar" /> }
```

**P: ¿Cómo uso un ícono feather?**
```html
<app-icon name="search" [size]="'20'" class="text-gray-500" />
<!-- Nombres: search, edit, trash, eye, download, bell, user, package, etc. -->
<!-- Ver lista completa en IconsService -->
```

**P: ¿Cómo obtengo el rol del usuario logueado?**
```typescript
private auth = inject(AuthService);
const rol = this.auth.getUserRole(); // 'Administrador' o null
```

**P: ¿Cómo navego con queryParams al duplicar paquete?**
```typescript
this.router.navigate(['/admin/publicar-paquete'], { queryParams: { duplicadoId: nuevoPaquete.id_paquete_publicado } });
```

**P: ¿Cómo leo un parámetro de ruta?**
```typescript
private route = inject(ActivatedRoute);
const id = Number(this.route.snapshot.paramMap.get('id'));
```

**P: ¿Por qué da error de compilación en el template con una arrow function?**
Angular prohíbe arrow functions con parámetros en templates de compilación estricta.
Mover la lógica al .ts:
```typescript
// En el .ts
calcularSubtotal(productos: any[]): number {
  return productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
}
```
```html
{{ calcularSubtotal(productos) }}
```

**P: ¿Cómo aplico clases de estado a un badge?**
```typescript
// Patrón estándar del proyecto:
getEstadoClases(nombre?: string): string {
  switch (nombre?.toLowerCase().trim()) {
    case 'activo':         return 'bg-status-active-bg text-status-active-text';
    case 'pendiente':      return 'bg-status-pending-bg text-status-pending-text';
    case 'en preparación': return 'bg-blue-100 text-blue-700';
    case 'finalizado':     return 'bg-status-active-bg text-secondary';
    case 'cancelado':      return 'bg-red-50 text-red-700';
    default:               return 'bg-status-neutral-bg text-status-neutral-text';
  }
}
```

**P: ¿Cuál es la URL base de la API?**
- Dev: `http://localhost:3000/api` (definido en `environment.ts`)
- El backend corre con `npm run start:backend` (concurrently con el frontend)

**P: ¿stopFisico null qué significa?**
- `stockFisico: null` → producto **SINÉRGICO** (sin límite de stock físico)
- `stockFisico: number` → producto **ENERGÉTICO** (stock físico limitado)
