import { Routes } from '@angular/router';

import { Home } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { RegistrarseComponent } from './pages/registrarse/registrarse';
import { ProductosComponent } from './pages/productos/productos';
import { ProductoDetalleSeleccionComponent } from './pages/producto-detalle-seleccion-component/producto-detalle-seleccion-component';
import { DetalleProductoSumarse } from './pages/detalle-producto-sumarse/detalle-producto-sumarse';
import { PaquetesPublicosComponent } from './pages/paquetes/paquetes';
import { FaqComponent } from './pages/faq/faq';
import { TerminosCondiciones } from './pages/legales/terminos-condiciones/terminos-condiciones';
import { PoliticaPrivacidad } from './pages/legales/politica-privacidad/politica-privacidad';
import { PoliticaDevoluciones } from './pages/legales/politica-devoluciones/politica-devoluciones';
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
import { AdministrarPaquetesComponent } from './pages/admin/components/administrar-paquetes/administrar-paquetes';
import { EditarPaqueteBaseComponent } from './pages/admin/components/editar-paquete-base/editar-paquete-base';
import { AdministrarPublicacionesComponent } from './pages/admin/components/administrar-publicaciones/administrar-publicaciones';
import { AdministrarPublicacionDetalleComponent } from './pages/admin/components/administrar-publicacion-detalle/administrar-publicacion-detalle';
import { SoporteComponent } from './pages/soporte/soporte';

export const routes: Routes = [

  {
    path: '',
    component: MainLayout,
    children: [

      // 🏠 Home
      { path: '', component: Home },

      // 🔐 Auth
      { path: 'login', component: LoginComponent },
      { path: 'registrarse', component: RegistrarseComponent },

      // 🛍️ Público
      { path: 'productos', component: ProductosComponent },
      { path: 'paquetes', component: PaquetesPublicosComponent },
      { path: 'faq', component: FaqComponent },
      { path: 'soporte', component: SoporteComponent },

      // 📜 Legales
      { path: 'terminos-y-condiciones', component: TerminosCondiciones },
      { path: 'politica-de-privacidad', component: PoliticaPrivacidad },
      { path: 'politica-de-devoluciones', component: PoliticaDevoluciones },

      // 📦 Detalles
      { path: 'producto/:id', component: ProductoDetalleSeleccionComponent },
      { path: 'paquete/:paqueteId/producto/:productoId', component: DetalleProductoSumarse },
      { path: 'paquete/:paqueteId/productos', component: ProductosDelPaquete },

      // 👤 Usuario
      { path: 'perfil', component: Perfil, canActivate: [authGuard] },
      { path: 'mis-pedidos', component: MisPedidosComponent, canActivate: [authGuard] },

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
          { path: 'editar-producto/:id', component: EditarProductoComponent },
          { path: 'gestionar-variantes/:id', component: GestionarVariantesComponent },
          { path: 'importar-productos', loadComponent: () => import('./pages/admin/components/importar-productos/importar-productos.component').then(m => m.ImportarProductosComponent) },
          { path: 'administrar-paquetes', component: AdministrarPaquetesComponent },
          { path: 'editar-paquete-base/:id', component: EditarPaqueteBaseComponent },
          { path: 'administrar-publicaciones', component: AdministrarPublicacionesComponent },
          { path: 'administrar-publicacion/:id', component: AdministrarPublicacionDetalleComponent },
          { path: 'administrar-publicacion/:id/envios', loadComponent: () => import('./pages/admin/components/gestion-envios/gestion-envios').then(m => m.GestionEnviosComponent) },
          { path: 'importar-productos', loadComponent: () => import('./pages/admin/components/importar-productos/importar-productos.component').then(m => m.ImportarProductosComponent) }
        ]
      }

    ]
  },

  // 🌍 Fallback
  { path: '**', redirectTo: '' }

];
