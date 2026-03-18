import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';
import { IconComponent } from '@app/shared/icono/icono';

@Component({
    selector: 'app-info-paquete',
    standalone: true,
    imports: [CommonModule, IconComponent],
    templateUrl: './info-paquete.html'
})
export class InfoPaqueteComponent {
    @Input() paquete!: PaquetePublicado;

    getTiempoRestante(fechaFin: Date): string {
        const ahora = new Date();
        const fin = new Date(fechaFin);
        const diff = fin.getTime() - ahora.getTime();

        if (diff <= 0) return 'Cerrado';

        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (dias > 0) return `${dias}d ${horas}h`;
        if (horas > 0) return `${horas}h ${minutos}m`;
        return `${minutos}m`;
    }

    getEstadoClass(estado?: string): string {
        if (!estado) return 'text-status-neutral-text bg-status-neutral-bg';

        const e = String(estado).toLowerCase();
        if (e.includes('abierto')) return 'text-status-active-text bg-status-active-bg border-success';
        if (e.includes('pend')) return 'text-status-pending-text bg-status-pending-bg border-warning';
        if (e.includes('cerr')) return 'text-status-closed-text bg-status-closed-bg border-error';
        return 'text-status-neutral-text bg-status-neutral-bg border-border-default';
    }
}