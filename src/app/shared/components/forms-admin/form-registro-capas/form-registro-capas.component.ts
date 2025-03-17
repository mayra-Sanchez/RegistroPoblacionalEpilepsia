import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/modules/consola-administrador/services/consola-administrador.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModalConfirmacionComponent } from '../../modal-confirmacion/modal-confirmacion.component';
import { Subscription } from 'rxjs';

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
    private dialog: MatDialog,
    private snackBar: MatSnackBar
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
    if (this.form.valid) {
      const capaData = {
        nombreCapa: this.form.value.nombre?.trim(),
        descripcion: this.form.value.descripcion?.trim(),
        jefeCapa: {
          id: this.form.value.jefeCapa?.id || 1,
          nombre: this.form.value.jefeCapa?.nombre?.trim(),
          numeroIdentificacion: this.form.value.jefeCapa?.numeroIdentificacion?.trim() || 'N/A',
        },
      };

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
            () => {
              this.mostrarNotificacion('Capa registrada con éxito. 🎉', 'success');
              this.form.reset();
            },
            () => {
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
