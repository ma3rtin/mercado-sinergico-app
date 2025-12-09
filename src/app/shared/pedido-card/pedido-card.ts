import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Pedido } from '@app/models/PedidosInterfaces/Pedido';
import { PedidoProducto } from '@app/models/PedidosInterfaces/PedidoProducto';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

@Component({
    selector: 'app-pedido-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pedido-card.html',
})
export class PedidoCard {

    // 📥 Pedido completo
    @Input({ required: true }) pedido!: Pedido;

    // 📤 Eventos disponibles
    @Output() abrir = new EventEmitter<number>();
    @Output() eliminar = new EventEmitter<number>();

    // ============================
    // COMPUTED PROPERTIES
    // ============================

    paquete = computed(() => this.pedido.paquetePublicado);

    imagenPrincipal = computed(() =>
        this.paquete()?.paqueteBase?.imagen_url
        ?? this.paquete()?.imagen_url
        ?? '/assets/images/placeholder-product.png'
    );

    marca = computed(() => this.paquete()?.paqueteBase?.marca?.nombre ?? null);

    categoria = computed(() => this.paquete()?.paqueteBase?.categoria?.nombre ?? null);

    estado = computed(() => this.pedido.estado?.nombre ?? 'Sin estado');

    productosCount = computed(() =>
        this.pedido.pedidoProductos?.reduce((acc, x) => acc + x.cantidad, 0) ?? 0
    );

    fechaPedido = computed(() => {
        if (!this.pedido.fecha) return 'N/A';
        return new Date(this.pedido.fecha).toLocaleDateString('es-AR');
    });

    // Tiempo restante (si el paquete tiene fecha fin)
    tiempoRestante = computed(() => {
        const fechaFin = this.paquete()?.fecha_fin;
        if (!fechaFin) return null;

        const ahora = new Date();
        const fin = new Date(fechaFin);
        const diff = fin.getTime() - ahora.getTime();

        if (diff <= 0) return 'Finalizado';

        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return dias > 0 ? `${dias}d ${horas}h` : `${horas}h`;
    });

    // ============================
    // MÉTODOS DE UI
    // ============================

    badgeEstadoClass() {
        const est = this.estado().toLowerCase();

        if (est.includes('confirm')) return 'bg-green-100 text-green-800 border-green-300';
        if (est.includes('pend')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        if (est.includes('cancel')) return 'bg-red-100 text-red-800 border-red-300';
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }

    onAbrir() {
        this.abrir.emit(this.pedido.id_pedido!);
    }

    onEliminar(e: MouseEvent) {
        e.stopPropagation();
        this.eliminar.emit(this.pedido.id_pedido!);
    }

    onImageError(event: Event) {
        const img = event.target as HTMLImageElement;
        img.src = '/assets/images/placeholder-product.png';
    }
}
