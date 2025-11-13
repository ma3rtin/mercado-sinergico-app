import { Routes } from '@angular/router';
import { RenderMode } from '@angular/ssr';

import { Home } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { RegistrarseComponent } from './pages/registrarse/registrarse';
import { ProductosComponent } from './pages/productos/productos';
import { ProductoDetalleSeleccionComponent } from './pages/producto-detalle-seleccion-component/producto-detalle-seleccion-component';
import { DetalleProductoSumarse } from './pages/detalle-producto-sumarse/detalle-producto-sumarse';
import { PaquetesComponent } from './pages/paquetes/paquetes';
import { PerfilAdmin } from './pages/admin/components/perfil-admin/perfil-admin';
import { CrearProductoComponent } from './pages/admin/components/crear-producto/crear-producto';
import { CrearPaqueteComponent } from './pages/admin/components/crear-paquete/crear-paquete';
import { PublicarPaqueteComponent } from './pages/admin/components/publicar-paquete/publicar-paquete';
import { AdministrarPlantillasComponent } from './pages/admin/components/administrar-plantillas.component/administrar-plantillas.component';
import { AdministrarProductosComponent } from './pages/admin/components/administrar-producto/administrar-producto';
import { EditarProductoComponent } from './pages/admin/components/editar-producto/editar-producto';
import { Perfil } from './modules/usuario/pages/perfil/perfil';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { MisPaquetesComponent } from './pages/mis-paquetes/mis-paquetes';

export const routes: Routes = [
  { 
    path: '', 
    component: Home, 
    data: { 
      renderMode: RenderMode.Client,
      breadcrumb: '' // Vacío porque "Home" es la raíz
    } 
  },
  
  { 
    path: 'login', 
    component: LoginComponent,
    data: { breadcrumb: 'Iniciar Sesión' }
  },
  
  { 
    path: 'registrarse', 
    component: RegistrarseComponent,
    data: { breadcrumb: 'Registrarse' }
  },
  
  // 🛍️ Flujo de compra: Home > Productos > Detalle > Sumarse > Mis Paquetes
  { 
    path: 'productos', 
    component: ProductosComponent,
    data: { breadcrumb: 'Productos' }
  },

  {
    path: 'detalleSeleccionProducto/:id',
    component: ProductoDetalleSeleccionComponent,
    data: { 
      renderMode: RenderMode.Server,
      breadcrumb: 'Detalle'
    },
  },

  {
    path: 'detalleProductoSumarse/:productoId/:paqueteId',
    component: DetalleProductoSumarse,
    data: { 
      renderMode: RenderMode.Server,
      breadcrumb: 'Sumarse'
    },
  },

  { 
    path: 'paquetes-publicados', 
    component: PaquetesComponent,
    data: { breadcrumb: 'Paquetes Publicados' }
  },

  // 👤 Rutas usuario (con login)
  { 
    path: 'perfil', 
    component: Perfil, 
    canActivate: [authGuard],
    data: { breadcrumb: 'Mi Perfil' }
  },

  { 
    path: 'mis-paquetes', 
    component: MisPaquetesComponent, 
    canActivate: [authGuard],
    data: { breadcrumb: 'Mis Paquetes' }
  },

  // 🧑‍💻 Rutas de admin
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    data: { 
      renderMode: RenderMode.Client,
      breadcrumb: 'Administración'
    },
    children: [
      {
        path: '',
        redirectTo: 'perfil',
        pathMatch: 'full'
      },
      {
        path: 'perfil', 
        component: PerfilAdmin,
        data: { breadcrumb: 'Perfil Admin' }
      },
      {
        path: 'crear-producto', 
        component: CrearProductoComponent,
        data: { breadcrumb: 'Crear Producto' }
      },
      {
        path: 'crear-paquete', 
        component: CrearPaqueteComponent,
        data: { breadcrumb: 'Crear Paquete' }
      },
      {
        path: 'publicar-paquete', 
        component: PublicarPaqueteComponent,
        data: { breadcrumb: 'Publicar Paquete' }
      },
      {
        path: 'administrar-plantillas', 
        component: AdministrarPlantillasComponent,
        data: { breadcrumb: 'Administrar Plantillas' }
      },
      {
        path: 'administrar-productos', 
        component: AdministrarProductosComponent,
        data: { breadcrumb: 'Administrar Productos' }
      },
      {
        path: 'editar-producto/:id',
        component: EditarProductoComponent, 
        data: { 
          renderMode: RenderMode.Client,
          breadcrumb: 'Editar Producto'
        }
      },
    ]
  },

  // 🌍 Fallback
  { 
    path: '**', 
    component: Home,
    data: { breadcrumb: 'Página no encontrada' }
  },
];

/**
 * 📍 Ejemplos de breadcrumbs resultantes:
 * 
 * Ruta: /
 * Breadcrumb: Inicio
 * 
 * Ruta: /productos
 * Breadcrumb: Inicio > Productos
 * 
 * Ruta: /detalleSeleccionProducto/123
 * Breadcrumb: Inicio > Detalle del Producto
 * 
 * Ruta: /admin/crear-producto
 * Breadcrumb: Inicio > Administración > Crear Producto
 * 
 * Ruta: /admin/editar-producto/456
 * Breadcrumb: Inicio > Administración > Editar Producto
 * 
 * Ruta: /perfil
 * Breadcrumb: Inicio > Mi Perfil
 * 
 * Ruta: /paquetes-publicados
 * Breadcrumb: Inicio > Paquetes Publicados
 */