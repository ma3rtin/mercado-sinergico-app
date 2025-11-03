import { EditarProductoComponent } from './pages/admin/components/editar-producto/editar-producto';
import { ProductoDetalleSeleccionComponent } from './pages/producto-detalle-seleccion-component/producto-detalle-seleccion-component';
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { RegistrarseComponent } from './pages/registrarse/registrarse';
import { ProductosComponent } from './pages/productos/productos';

import { DetalleProductoSumarse } from './pages/detalle-producto-sumarse/detalle-producto-sumarse';
import { PaquetesComponent } from './pages/paquetes/paquetes';
import { PerfilAdmin } from './pages/admin/components/perfil-admin/perfil-admin';
import { CrearProductoComponent } from './pages/admin/components/crear-producto/crear-producto';
import { CrearPaqueteComponent } from './pages/admin/components/crear-paquete/crear-paquete';
import { Perfil } from './modules/usuario/pages/perfil/perfil';
import { AdministrarPlantillasComponent } from './pages/admin/components/administrar-plantillas.component/administrar-plantillas.component';
import { AdministrarProductosComponent } from './pages/admin/components/administrar-producto/administrar-producto';
import { PublicarPaqueteComponent } from './pages/admin/components/publicar-paquete/publicar-paquete';
import { RenderMode } from '@angular/ssr';
import { MisPaquetesComponent } from './pages/mis-paquetes/mis-paquetes';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: LoginComponent },
  { path: 'registrarse', component: RegistrarseComponent },
  { path: 'productos', component: ProductosComponent },
  {
    path: 'producto/:id',
    component: ProductosComponent,
    data: { renderMode: RenderMode.Server },
  },
  {
    path: 'detalleSeleccionProducto',
    component: ProductoDetalleSeleccionComponent,
  },
  {
    path: 'detalleSeleccionProducto/:id',
    component: ProductoDetalleSeleccionComponent,
    data: { renderMode: RenderMode.Server },
  },
  {
    path: 'detalleProductoSumarse/:id',
    component: DetalleProductoSumarse,
    data: { renderMode: RenderMode.Server },
  },
  { path: 'paquetes-publicados', component: PaquetesComponent },
  { path: 'perfil-admin', component: PerfilAdmin },
  { path: 'crear-producto', component: CrearProductoComponent },
  { path: 'crear-paquete', component: CrearPaqueteComponent },
  { path: 'publicar-paquete', component: PublicarPaqueteComponent },
  { path: 'perfil', component: Perfil },
  { path: 'administrar-plantillas', component: AdministrarPlantillasComponent },
  { path: 'administrar-productos', component: AdministrarProductosComponent },
  {
    path: 'editar-producto/:id',
    component: EditarProductoComponent,
    data: { renderMode: RenderMode.Server },
  },
  { path: 'mis-paquetes', component: MisPaquetesComponent },
  { path: '**', component: Home },
];
