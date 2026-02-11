import { Routes } from '@angular/router';
import { RenderMode } from '@angular/ssr';
import { Home } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { RegistrarseComponent } from './pages/registrarse/registrarse';
import { ProductosComponent } from './pages/productos/productos';
import { ProductoDetalleSeleccionComponent } from './pages/producto-detalle-seleccion-component/producto-detalle-seleccion-component';
import { DetalleProductoSumarse } from './pages/detalle-producto-sumarse/detalle-producto-sumarse';
import { PaquetesPublicosComponent } from './pages/paquetes/paquetes';
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
import { MisPedidosComponent } from './pages/mis-pedidos/mis-pedidos';
import { ProductosDelPaquete } from './pages/productos-del-paquete/productos-del-paquete';
import { MainLayout } from './layouts/main-layout/main-layout';
import { GestionarVariantesComponent } from './pages/gestionar-variantes/gestionar-variantes';

export const routes: Routes = [

  {
    path: '',
    component: MainLayout,
    children: [

      // 🏠 Home
      {
        path: '',
        component: Home,
        data: { renderMode: RenderMode.Client }
      },

      // 🛍️ Público
      { path: 'productos', component: ProductosComponent },
      { path: 'paquetes', component: PaquetesPublicosComponent },

      // 📦 Detalles
      {
        path: 'producto/:id',
        component: ProductoDetalleSeleccionComponent,
        data: { renderMode: RenderMode.Server }
      },
      { path: 'paquete/:paqueteId/productos', component: ProductosDelPaquete },
      {
        path: 'paquete/:paqueteId/producto/:productoId',
        component: DetalleProductoSumarse,
        data: { renderMode: RenderMode.Server }
      },

      // 👤 Usuario
      {
        path: 'perfil',
        component: Perfil,
        canActivate: [authGuard]
      },
      {
        path: 'mis-pedidos',
        component: MisPedidosComponent,
        canActivate: [authGuard]
      },

      // 🔐 Auth
      { path: 'login', component: LoginComponent },
      { path: 'registrarse', component: RegistrarseComponent },

      // 🧑‍💻 Admin
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        children: [
          { path: '', redirectTo: 'perfil', pathMatch: 'full' },
          { path: 'perfil', component: PerfilAdmin },
          { path: 'crear-producto', component: CrearProductoComponent },
          { path: 'crear-paquete', component: CrearPaqueteComponent },
          { path: 'publicar-paquete', component: PublicarPaqueteComponent },
          { path: 'administrar-plantillas', component: AdministrarPlantillasComponent },
          { path: 'administrar-productos', component: AdministrarProductosComponent },
          {
            path: 'editar-producto/:id',
            component: EditarProductoComponent,
            data: { renderMode: RenderMode.Client }
          },
          {
            path: 'gestionar-variantes/:id',
            component: GestionarVariantesComponent
          }
        ]
      }
    ]
  },

  // 🌍 Fallback
  {
    path: '**',
    redirectTo: ''
  }
];
