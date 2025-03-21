import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-registro-capas',
  templateUrl: './form-registro-capas.component.html',
  styleUrls: ['./form-registro-capas.component.css']
})
export class FormRegistroCapasComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  private capasSubscription: Subscription = Subscription.EMPTY;

  constructor(
    private fb: FormBuilder,
    private consolaAdministradorService: ConsolaAdministradorService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      jefeCapa: this.fb.group({
        id: [null],
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        numeroIdentificacion: ['', [Validators.required, Validators.minLength(5)]],
      }),
    });
  }

  ngOnDestroy(): void {
    if (this.capasSubscription) {
      this.capasSubscription.unsubscribe();
    }
  }

  registrarCapa(): void {
    if (this.form.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Por favor, completa todos los campos correctamente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      this.form.markAllAsTouched();
      return;
    }

    const capaData = {
      nombreCapa: this.form.value.nombre?.trim(),
      descripcion: this.form.value.descripcion?.trim(),
      jefeCapa: {
        id: this.form.value.jefeCapa?.id || 1,
        nombre: this.form.value.jefeCapa?.nombre?.trim(),
        numeroIdentificacion: this.form.value.jefeCapa?.numeroIdentificacion?.trim() || 'N/A',
      },
    };

    Swal.fire({
      title: '¿Confirmar registro?',
      text: '¿Estás seguro de registrar esta capa?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consolaAdministradorService.registrarCapa(capaData).subscribe(
          () => {
            Swal.fire({
              title: '¡Registro exitoso! 🎉',
              html: `
                <div style="text-align: center;">
                  <p>La capa ha sido registrada correctamente.</p>
                  <img src="https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif" 
                    alt="Éxito" style="width: 150px; margin-top: 10px;">
                </div>
              `,
              icon: 'success',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#3085d6',
              background: '#f1f8ff',
              timer: 5000,
              timerProgressBar: true
            });
            this.form.reset();
          },
          () => {
            Swal.fire({
              title: 'Error',
              text: 'Ocurrió un problema al registrar la capa.',
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        );
      }
    });
  }
}
