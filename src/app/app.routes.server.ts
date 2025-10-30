import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rutas estáticas
  { path: '', renderMode: RenderMode.Server },
  { path: 'login', renderMode: RenderMode.Server },
  { path: 'registrarse', renderMode: RenderMode.Server },
  { path: 'productos', renderMode: RenderMode.Server },
  { path: 'detalleSeleccionProducto', renderMode: RenderMode.Server },
  { path: 'perfil-admin', renderMode: RenderMode.Server },
  { path: 'crear-producto', renderMode: RenderMode.Server },
  { path: 'crear-paquete', renderMode: RenderMode.Server },
  { path: 'publicar-paquete', renderMode: RenderMode.Server },
  { path: 'perfil', renderMode: RenderMode.Server },
  { path: 'administrar-plantillas', renderMode: RenderMode.Server },
  { path: 'administrar-productos', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server },

  // Rutas dinámicas
  { path: 'producto/:id', renderMode: RenderMode.Server },
  { path: 'detalleSeleccionProducto/:id', renderMode: RenderMode.Server },
  { path: 'detalleProductoSumarse/:id', renderMode: RenderMode.Server },
  { path: 'editar-producto/:id', renderMode: RenderMode.Server }
];
