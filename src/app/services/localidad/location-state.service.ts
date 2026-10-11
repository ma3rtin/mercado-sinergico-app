import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Localidad } from './localidad.service';

@Injectable({
    providedIn: 'root'
})
export class LocationStateService {
    private readonly STORAGE_KEY = 'selected_location';
    private platformId = inject(PLATFORM_ID);

    // Signal to hold the current selected location
    readonly selectedLocation = signal<Localidad | null>(this.loadFromStorage());

    constructor() {
        // Effect to save to localStorage whenever the signal changes
        effect(() => {
            if (isPlatformBrowser(this.platformId)) {
                const location = this.selectedLocation();
                if (location) {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(location));
                } else {
                    localStorage.removeItem(this.STORAGE_KEY);
                }
            }
        });
    }

    private loadFromStorage(): Localidad | null {
        if (isPlatformBrowser(this.platformId)) {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        }
        return null;
    }

    setLocation(location: Localidad) {
        this.selectedLocation.set(location);
    }

    clearLocation() {
        this.selectedLocation.set(null);
    }

    hasLocation(): boolean {
        return this.selectedLocation() !== null;
    }
}
