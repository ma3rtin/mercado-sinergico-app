import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../environment.js';

@Injectable({ providedIn: 'root' })
export class ApiService {
    protected http = inject(HttpClient);

    private baseUrl = API_BASE_URL;

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

    delete<T>(path: string): Observable<T> {
        return this.http.delete<T>(this.buildUrl(path));
    }
}
