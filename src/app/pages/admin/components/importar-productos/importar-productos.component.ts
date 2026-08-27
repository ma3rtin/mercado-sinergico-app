import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType, HttpClientModule } from '@angular/common/http';
import { toast } from 'ngx-sonner';
import { environment } from '../../../../../environments/environment';
import { IconComponent } from '@app/shared/icono/icono';
import { ButtonComponent } from '@app/shared/botones/buttonComponent';
import { BackButtonComponent } from '@app/shared/back-button/back-button';
import { AdminCreateWrapperComponent } from '@app/shared/admin-create-wrapper/admin-create-wrapper';
import { LoadingOverlay } from '@app/shared/loading-overlay/loading-overlay';

interface ImportResult {
    success: boolean;
    message: string;
    data?: {
        importados: number;
        errores: Array<{
            fila: number;
            mensaje: string;
            datos: any;
        }>;
    };
}

@Component({
    selector: 'app-importar-productos',
    standalone: true,
    imports: [CommonModule, HttpClientModule, IconComponent, ButtonComponent, BackButtonComponent, AdminCreateWrapperComponent, LoadingOverlay],
    templateUrl: './importar-productos.component.html',
    styleUrls: ['./importar-productos.component.css'],
})
export class ImportarProductosComponent {
    private readonly http = inject(HttpClient);

    // Signals
    selectedFile = signal<File | null>(null);
    isUploading = signal(false);
    uploadProgress = signal(0);
    importResult = signal<ImportResult | null>(null);

    // Computed signals
    hasFile = computed(() => this.selectedFile() !== null);
    hasErrors = computed(() => {
        const result = this.importResult();
        return result?.data?.errores && result.data.errores.length > 0;
    });
    hasResult = computed(() => this.importResult() !== null);

    private readonly apiUrl = `${environment.apiUrl}/productos/excel`;

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.importResult.set(null);

            // Validar tipo de archivo
            const validTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];

            if (!validTypes.includes(file.type)) {
                toast.error('Por favor, selecciona un archivo Excel (.xls o .xlsx)');
                this.selectedFile.set(null);
                input.value = '';
                return;
            }

            this.selectedFile.set(file);
        }
    }

    importarProductos(): void {
        const file = this.selectedFile();

        if (!file) {
            toast.error('Por favor, selecciona un archivo Excel');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        this.isUploading.set(true);
        this.uploadProgress.set(0);

        this.http
            .post<ImportResult>(`${this.apiUrl}/importar`, formData, {
                reportProgress: true,
                observe: 'events',
            })
            .subscribe({
                next: (event) => {
                    if (event.type === HttpEventType.UploadProgress && event.total) {
                        const progress = Math.round((100 * event.loaded) / event.total);
                        this.uploadProgress.set(progress);
                    } else if (event.type === HttpEventType.Response) {
                        const result = event.body;
                        this.importResult.set(result);
                        this.isUploading.set(false);

                        if (result?.success) {
                            if (result.data) {
                                const { importados, errores } = result.data;
                                if (errores.length === 0) {
                                    toast.success(`✅ ${importados} productos importados exitosamente`);
                                } else {
                                    toast.warning(
                                        `⚠️ ${importados} productos importados, ${errores.length} errores encontrados`
                                    );
                                }
                            }
                        } else {
                            toast.error(`❌ Error: ${result?.message}`);
                        }
                    }
                },
                error: (error) => {
                    this.isUploading.set(false);
                    console.error('Error al importar:', error);
                    
                    // Si el backend devolvió nuestro objeto ImportResult con un código de error (ej: 400)
                    if (error.error && typeof error.error === 'object' && 'success' in error.error) {
                        const result = error.error as ImportResult;
                        this.importResult.set(result);
                        toast.error(`❌ Error: ${result.message}`);
                    } else {
                        // Error de red, 500 server error genérico, o algo que no está en el formato esperado
                        toast.error(error.error?.message || 'Error al importar productos. Por favor, intenta de nuevo.');
                        this.importResult.set({
                            success: false,
                            message: error.error?.message || 'Error al comunicarse con el servidor.'
                        });
                    }
                },
            });
    }

    exportarProductos(): void {
        toast.info('Preparando exportación...');

        this.http.get(`${this.apiUrl}/exportar`, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;

                const fecha = new Date().toISOString().split('T')[0];
                link.download = `productos_${fecha}.xlsx`;

                link.click();
                window.URL.revokeObjectURL(url);

                toast.success('✅ Productos exportados exitosamente');
            },
            error: (error) => {
                console.error('Error al exportar:', error);
                toast.error('Error al exportar productos. Por favor, intenta nuevamente.');
            },
        });
    }

    descargarPlantilla(): void {
        this.http.get(`${this.apiUrl}/plantilla`, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'plantilla_productos.xlsx';
                link.click();
                window.URL.revokeObjectURL(url);

                toast.success('✅ Plantilla descargada exitosamente');
            },
            error: (error) => {
                console.error('Error al descargar plantilla:', error);
                toast.error('Error al descargar plantilla. Por favor, intenta nuevamente.');
            },
        });
    }

    limpiar(): void {
        this.selectedFile.set(null);
        this.importResult.set(null);
        this.uploadProgress.set(0);
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }
}
