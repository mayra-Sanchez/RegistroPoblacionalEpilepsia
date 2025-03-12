import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsolaRegistroService {
    private apiUrl = 'http://localhost:8080/api/patients';

    constructor(private http: HttpClient) {}
  
    // Registrar un nuevo paciente
    registrarPaciente(paciente: any): Observable<any> {
      return this.http.post(`${this.apiUrl}/register`, paciente);
    }
  
    // Obtener todos los pacientes
    obtenerPacientes(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}/list`);
    }
  
    // Obtener un paciente por número de identificación
    obtenerPacientePorId(identificationNumber: number): Observable<any> {
      return this.http.get(`${this.apiUrl}/${identificationNumber}`);
    }
  
    // Actualizar un paciente
    actualizarPaciente(identificationNumber: number, paciente: any): Observable<any> {
      return this.http.put(`${this.apiUrl}/update/${identificationNumber}`, paciente);
    }
  
    // Eliminar un paciente
    eliminarPaciente(identificationNumber: number): Observable<any> {
      return this.http.delete(`${this.apiUrl}/delete/${identificationNumber}`);
    }
  }