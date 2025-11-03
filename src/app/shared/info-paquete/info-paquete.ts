import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaquetePublicado } from '@app/models/PaquetesInterfaces/PaquetePublicado';

@Component({
    selector: 'app-info-paquete',
    standalone: true,
    imports: [CommonModule],
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
        if (!estado) return 'text-gray-600 bg-gray-100';

        const e = String(estado).toLowerCase();
        if (e.includes('abierto')) return 'text-green-700 bg-green-50 border-green-200';
        if (e.includes('pend')) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
        if (e.includes('cerr')) return 'text-red-700 bg-red-50 border-red-200';
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
}