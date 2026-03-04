import { Component, input, effect, signal, untracked, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-delayed-skeleton',
    standalone: true,
    template: `
    @if (isLoading()) {
      @if (showSkeleton()) {
        <ng-content select="[skeleton]"></ng-content>
      }
    } @else {
      <ng-content></ng-content>
    }
  `
})
export class DelayedSkeleton implements OnDestroy {
    isLoading = input.required<boolean>();
    delay = input<number>(200);

    showSkeleton = signal(false);
    private timeoutId: any;

    constructor() {
        effect(() => {
            const loading = this.isLoading();
            untracked(() => {
                this.clearTimeout();
                if (loading) {
                    // Comenzar el retraso antes de mostrar el skeleton
                    this.timeoutId = setTimeout(() => {
                        this.showSkeleton.set(true);
                    }, this.delay());
                } else {
                    // Termina la carga, ocultar el skeleton
                    this.showSkeleton.set(false);
                }
            });
        });
    }

    private clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    ngOnDestroy() {
        this.clearTimeout();
    }
}
