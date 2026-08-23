import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';

@Component({
  selector: 'app-loading-overlay',
  imports: [],
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.css'
})
export class LoadingOverlay {
  visible = input(false);
  titulo = input('Procesando...');
  mensajes = input<string[]>([]);
  duracionMs = input(15000);
  maximo = input(90);

  private destroyRef = inject(DestroyRef);

  protected renderizar = signal(false);
  protected saliendo = signal(false);
  protected progreso = signal(0);

  protected mensajeActual = computed(() => {
    const msgs = this.mensajes();
    if (msgs.length === 0) return this.titulo();
    const pct = this.progreso() / 100;
    const idx = Math.min(msgs.length - 1, Math.floor(pct * msgs.length));
    return msgs[idx];
  });

  private frameId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private startTime = 0;
  private algunaVezVisible = false;

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.algunaVezVisible = true;
        this.start();
      } else if (this.algunaVezVisible) {
        this.completar();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.cancelFrame();
      if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    });
  }

  private start(): void {
    this.cancelFrame();
    this.cleanupTimeout();
    this.renderizar.set(true);
    this.saliendo.set(false);
    this.progreso.set(0);
    this.startTime = performance.now();
    this.loop();
  }

  private loop(): void {
    if (!this.visible()) return;
    const elapsed = performance.now() - this.startTime;
    const ratio = Math.min(elapsed / this.duracionMs(), 1);
    const eased = 1 - Math.pow(1 - ratio, 4);
    this.progreso.set(Math.round(this.maximo() * eased));
    this.frameId = requestAnimationFrame(() => this.loop());
  }

  private completar(): void {
    this.cancelFrame();
    this.progreso.set(100);
    this.saliendo.set(true);
    this.timeoutId = setTimeout(() => {
      this.renderizar.set(false);
      this.saliendo.set(false);
      this.progreso.set(0);
      this.timeoutId = null;
    }, 400);
  }

  private cancelFrame(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private cleanupTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
