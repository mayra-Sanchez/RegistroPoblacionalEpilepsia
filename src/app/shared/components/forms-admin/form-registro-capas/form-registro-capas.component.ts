import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalConfirmacionComponent } from '../../modal-confirmacion/modal-confirmacion.component';

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
    private consolaAdministradorService: ConsolaAdministradorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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
    if (this.form.valid) {
      const capaData = {
        id: this.form.value.id || null,
        nombreCapa: this.form.value.nombre?.trim(),
        descripcion: this.form.value.descripcion?.trim(),
        jefeCapa: {
          id: this.form.value.jefeCapa?.id || 1,
          nombre: this.form.value.jefeCapa?.nombre?.trim(),
          numero_identificacion: this.form.value.jefeCapa?.numero_identificacion?.trim() || 'N/A',
        },
      };

      // Abrir el modal de confirmación
      const dialogRef = this.dialog.open(ModalConfirmacionComponent, {
        width: '400px', 
        panelClass: 'custom-modal', 
        data: {
          titulo: 'Confirmar Registro',
          mensaje: '¿Estás seguro de registrar esta capa?',
        },
      });
      

      dialogRef.afterClosed().subscribe((confirmado) => {
        if (confirmado) {
          this.consolaAdministradorService.registrarCapa(capaData).subscribe(
            (response) => {
              this.mostrarNotificacion('Capa registrada con éxito. 🎉', 'success');
              this.form.reset();
            },
            (error) => {
              this.mostrarNotificacion('Ocurrió un error al registrar la capa.', 'error');
            }
          );
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'snack-success' : 'snack-error',
    });
  }
}
