import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // 🌍 Rutas públicas (renderizadas previamente)
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'registrarse', renderMode: RenderMode.Prerender },
  { path: 'productos', renderMode: RenderMode.Prerender },
  { path: 'paquetes', renderMode: RenderMode.Prerender },

  // 👤 Rutas de usuario (solo client-side)
  { path: 'perfil', renderMode: RenderMode.Client },
  { path: 'mis-pedidos', renderMode: RenderMode.Client },

  // 🧑‍💻 Rutas de administrador (base + hijos)
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/perfil', renderMode: RenderMode.Client },
  { path: 'admin/crear-producto', renderMode: RenderMode.Client },
  { path: 'admin/crear-paquete', renderMode: RenderMode.Client },
  { path: 'admin/publicar-paquete', renderMode: RenderMode.Client },
  { path: 'admin/administrar-plantillas', renderMode: RenderMode.Client },
  { path: 'admin/administrar-productos', renderMode: RenderMode.Client },
  { path: 'admin/editar-producto/:id', renderMode: RenderMode.Client },

  // 🧩 Rutas dinámicas (renderizadas en el servidor)
  { path: 'producto/:id', renderMode: RenderMode.Server },
  { path: 'paquete/:paqueteId/producto/:productoId', renderMode: RenderMode.Server },

  // 🌍 Fallback
  { path: '**', renderMode: RenderMode.Client },
];
