import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas estáticas
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'registrarse', renderMode: RenderMode.Prerender },
  { path: 'productos', renderMode: RenderMode.Prerender },
  { path: 'perfil-admin', renderMode: RenderMode.Prerender },
  { path: 'crear-producto', renderMode: RenderMode.Prerender },
  { path: 'crear-paquete', renderMode: RenderMode.Prerender },
  { path: 'publicar-paquete', renderMode: RenderMode.Prerender },
  { path: 'perfil', renderMode: RenderMode.Prerender },
  { path: 'administrar-plantillas', renderMode: RenderMode.Prerender },
  { path: 'administrar-productos', renderMode: RenderMode.Prerender },
  { path: 'paquetes-publicados', renderMode: RenderMode.Prerender },
  { path: 'mis-paquetes', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Prerender },

  // Rutas dinámicas
  { path: 'detalleSeleccionProducto/:id', renderMode: RenderMode.Server },
  { path: 'detalleProductoSumarse/:productoId/:paqueteId',renderMode: RenderMode.Server },
  { path: 'editar-producto/:id', renderMode: RenderMode.Server }
];
