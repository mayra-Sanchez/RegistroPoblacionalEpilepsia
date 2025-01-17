import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';

@Component({
  selector: 'app-form-registro-capas',
  templateUrl: './form-registro-capas.component.html',
  styleUrls: ['./form-registro-capas.component.css']
})
export class FormRegistroCapasComponent implements OnInit {
  form!: FormGroup;
  mensaje: string = ''; // Mensaje para mostrar al usuario

  constructor(
    private fb: FormBuilder,
    private consolaAdministradorService: ConsolaAdministradorService
  ) {}

  ngOnInit(): void {
    // Inicializar el formulario reactivo
    this.form = this.fb.group({
      id: [null], // ID opcional
      nombre: ['', [Validators.required, Validators.minLength(3)]], // Requerido, al menos 3 caracteres
      descripcion: ['', [Validators.required, Validators.minLength(5)]], // Requerido, al menos 5 caracteres
      jefeCapa: this.fb.group({
        id: [null], // ID opcional para jefe de capa
        nombre: ['', [Validators.required, Validators.minLength(3)]], // Requerido, al menos 3 caracteres
        numero_identificacion: ['', [Validators.required, Validators.minLength(5)]], // Requerido
      }),
    });
  }

  registrarCapa(): void {
    // Validar el formulario antes de enviar
    if (this.form.valid) {
      // Preparar los datos para enviar al backend
      const capaData = {
        id: this.form.value.id || null, // Asegurar que sea null si no hay ID
        nombreCapa: this.form.value.nombre?.trim(), // Eliminar espacios en blanco
        descripcion: this.form.value.descripcion?.trim(), // Eliminar espacios en blanco
        jefeCapa: {
          id: this.form.value.jefeCapa?.id || 1, // Asignar 1 si no hay ID
          nombre: this.form.value.jefeCapa?.nombre?.trim(), // Validar y limpiar nombre
          numero_identificacion: this.form.value.jefeCapa?.numero_identificacion?.trim() || 'N/A', // Predeterminado si no hay valor
        },
      };

      // Verificar los datos antes de enviarlos
      console.log('Datos preparados para enviar:', capaData);

      // Llamar al servicio para registrar la capa
      this.consolaAdministradorService.registrarCapa(capaData).subscribe(
        (response) => {
          console.log('Respuesta del servidor:', response);
          this.mensaje = 'Capa registrada con éxito. 🎉';
          this.form.reset(); // Limpiar el formulario después de un registro exitoso
        },
        (error) => {
          console.error('Error al registrar la capa:', error);
          if (error.error?.message) {
            this.mensaje = `Error: ${error.error.message}`;
          } else {
            this.mensaje = 'Ocurrió un error al registrar la capa. Intenta nuevamente.';
          }
        }
      );
    } else {
      console.log('Formulario inválido:', this.form.value);
      this.form.markAllAsTouched(); // Marcar todos los campos como tocados para mostrar errores
    }
  }
}
