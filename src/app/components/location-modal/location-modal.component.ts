import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Localidad, LocalidadService } from '../../services/localidad/localidad.service';
import { LocationStateService } from '../../services/localidad/location-state.service';

@Component({
    selector: 'app-location-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './location-modal.component.html',
    styleUrl: './location-modal.component.css'
})
export class LocationModalComponent implements OnInit {
    private localidadService = inject(LocalidadService);
    private locationState = inject(LocationStateService);

    localidades: Localidad[] = [];
    isLoading = true;

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

    selectLocation(localidad: Localidad) {
        this.locationState.setLocation(localidad);
    }
}
