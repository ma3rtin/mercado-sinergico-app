import { Component, inject, OnInit, signal, computed, ChangeDetectorRef, DestroyRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    // 🔧 Services
    private readonly localidadService = inject(LocalidadService);
    private readonly locationState = inject(LocationStateService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);
    private readonly platformId = inject(PLATFORM_ID);

    // 🚀 Signals
    localidades = signal<Localidad[]>([]);
    isLoading = signal(true);
    selectedLocalidadId = signal<number | null>(null);
    searchTerm = signal<string>('');
    showDropdown = signal<boolean>(false);

    // 🧩 Computed
    hasLocalidades = computed(() => this.localidades().length > 0);
    canConfirm = computed(() => this.selectedLocalidadId() !== null);

    // Localidades filtradas y ordenadas alfabéticamente
    localidadesFiltradas = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        const localidades = this.localidades();

        // Filtrar
        const filtradas = term
            ? localidades.filter(loc =>
                loc.nombre.toLowerCase().includes(term)
            )
            : localidades;

        // Ordenar alfabéticamente
        return filtradas.sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es-AR')
        );
    });

    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.loadLocalidades();
        }
    }

    private loadLocalidades() {
        this.isLoading.set(true);

        this.localidadService.getAll()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    // ✅ Usar queueMicrotask para evitar NG0100
                    queueMicrotask(() => {
                        this.localidades.set(data);
                        this.isLoading.set(false);
                        this.cdr.markForCheck();
                    });
                },
                error: (err) => {
                    console.error('❌ Error loading localidades', err);
                    queueMicrotask(() => {
                        this.isLoading.set(false);
                        this.cdr.markForCheck();
                    });
                }
            });
    }

    onSelectionChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const value = target.value;
        this.selectedLocalidadId.set(value ? Number(value) : null);
    }

    onSearchChange(event: Event) {
        const target = event.target as HTMLInputElement;
        this.searchTerm.set(target.value);
    }

    confirmSelection() {
        const localidadId = this.selectedLocalidadId();

        if (!localidadId) {
            console.warn('⚠️ No hay localidad seleccionada');
            return;
        }

        const selected = this.localidades().find(l => l.id_localidad === localidadId);

        if (selected) {
            console.log('✅ Localidad seleccionada:', selected.nombre);
            this.locationState.setLocation(selected);
        } else {
            console.error('❌ Localidad no encontrada');
        }
    }
}
