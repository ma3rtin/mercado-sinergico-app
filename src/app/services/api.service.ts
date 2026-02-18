import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment.js';
//import { AuthService } from './auth/auth.service';
//import { HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
    protected http = inject(HttpClient);

    private baseUrl = environment.apiUrl;

    protected buildUrl(path: string): string {
        const cleanedPath = path.startsWith('/') ? path.substring(1) : path;
        return `${this.baseUrl}/${cleanedPath}`;
    }

    get<T>(path: string): Observable<T> {
        return this.http.get<T>(this.buildUrl(path));
    }

    post<T>(path: string, body: any): Observable<T> {
        return this.http.post<T>(this.buildUrl(path), body);
    }

    put<T>(path: string, body: any): Observable<T> {
        return this.http.put<T>(this.buildUrl(path), body);
    }

    patch<T>(path: string, body: any): Observable<T> {
        return this.http.patch<T>(this.buildUrl(path), body);
    }

    patchFormData<T>(path: string, formData: FormData): Observable<T> {
        // No setear Content-Type: Angular lo detecta automáticamente con FormData
        return this.http.patch<T>(this.buildUrl(path), formData);
    }

    delete<T>(path: string): Observable<T> {
        return this.http.delete<T>(this.buildUrl(path));
    }
}
