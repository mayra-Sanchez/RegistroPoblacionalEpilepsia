import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';

/**
 * Servicio para el manejo de documentos de consentimiento firmados
 * 
 * Proporciona funcionalidades para:
 * - Subir documentos de consentimiento firmados
 * - Descargar documentos previamente cargados
 * 
 * Los documentos pueden ser formatos PDF, imágenes de firma digital, u otros formatos admitidos.
 * 
 * @example
 * // Ejemplo de uso para subir un documento
 * this.signatureService.uploadConsentFile(12345, file).subscribe(
 *   response => console.log('Subida exitosa', response),
 *   error => console.error('Error al subir', error)
 * );
 */
@Injectable({
    providedIn: 'root'
})
export class SignatureUploadService {
    /**
     * Endpoint para la subida de documentos
     * @private
     */
    private readonly API_UPLOAD = `${environment.backendUrl}/documents/upload`;

    /**
     * Endpoint para la descarga de documentos
     * @private
     */
    private readonly API_DOWNLOAD = `${environment.backendUrl}/documents/download`;

    /**
     * Constructor del servicio
     * @param http Cliente HTTP para realizar las peticiones
     */
    constructor(private http: HttpClient) { }

    /**
     * Sube un documento de consentimiento firmado al servidor
     * 
     * @param patientId ID del paciente asociado al documento
     * @param file Archivo a subir (PDF, imagen, etc.)
     * @returns Observable que emite la respuesta del servidor (texto)
     * 
     * @throws Error Si ocurre un problema durante la subida:
     * - Error de red
     * - Error de validación del servidor (tamaño, tipo de archivo)
     * - Error de autenticación/autorización
     */
    uploadConsentFile(patientId: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post(this.API_UPLOAD, formData, {
            params: { patientId: patientId.toString() },
            responseType: 'text' // Esperamos una respuesta de texto del servidor
        });
    }

    /**
     * Descarga el documento de consentimiento de un paciente
     * 
     * @param patientId ID del paciente cuyo documento se desea descargar
     * @returns Observable que emite el Blob del documento descargado
     * 
     * @throws Error Si ocurre un problema durante la descarga:
     * - Documento no encontrado (404)
     * - Error de red
     * - Error de autenticación/autorización
     */
    downloadConsentFile(patientId: number): Observable<Blob> {
        return this.http.get(`${this.API_DOWNLOAD}/${patientId}`, {
            responseType: 'blob', // Indicamos que esperamos un archivo binario
            headers: {
                'Accept': '*/*' // Aceptamos cualquier tipo de contenido en la respuesta
            }
        });
    }
}