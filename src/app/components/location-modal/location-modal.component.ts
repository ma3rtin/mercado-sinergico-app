import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Localidad, LocalidadService } from '../../services/localidad/localidad.service';
import { LocationStateService } from '../../services/localidad/location-state.service';

@Component({
    selector: 'app-location-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './location-modal.component.html',
    styleUrl: './location-modal.component.css'
})
export class LocationModalComponent implements OnInit {
    private localidadService = inject(LocalidadService);
    private locationState = inject(LocationStateService);

    localidades: Localidad[] = [];
    isLoading = true;
    selectedLocalidadId: number | null = null;

    ngOnInit() {
        this.loadLocalidades();
    }

    loadLocalidades() {
        this.localidadService.getAll().subscribe({
            next: (data) => {
                this.localidades = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading localidades', err);
                this.isLoading = false;
            }
        });
    }

    confirmSelection() {
        if (this.selectedLocalidadId) {
            const selected = this.localidades.find(l => l.id_localidad == this.selectedLocalidadId);
            if (selected) {
                this.locationState.setLocation(selected);
            }
        }
    }
}
