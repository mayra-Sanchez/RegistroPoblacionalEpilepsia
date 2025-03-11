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
  mensaje: string = ''; 
  capas: any[] = [];
  private capasSubscription: Subscription = Subscription.EMPTY;

  constructor(
    private fb: FormBuilder,
    private consolaAdministradorService: ConsolaAdministradorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef // Inyectar ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Inicializar el formulario reactivo
    this.form = this.fb.group({
      id: [null],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      jefeCapa: this.fb.group({
        id: [null],
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        numero_identificacion: ['', [Validators.required, Validators.minLength(5)]],
      }),
    });

    // Obtener las capas iniciales
    this.obtenerCapas();
  }

  ngOnDestroy(): void {
    // Cancelar la suscripción para evitar pérdidas de memoria
    if (this.capasSubscription) {
      this.capasSubscription.unsubscribe();
    }
  }

  obtenerCapas(): void {
    this.capasSubscription = this.consolaAdministradorService.getAllLayers().subscribe(
      (capas) => {
        this.capas = capas;
        this.cdRef.detectChanges(); // Forzar la detección de cambios para actualizar la vista
      },
      (error) => {
        this.mostrarNotificacion('Error al obtener las capas.', 'error');
      }
    );
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
  
  eliminarCapa(capaId: number): void {
    // Mostrar el modal de confirmación antes de eliminar
    const dialogRef = this.dialog.open(ModalConfirmacionComponent, {
      width: '400px',
      panelClass: 'custom-modal',
      data: {
        titulo: 'Confirmar Eliminación',
        mensaje: '¿Estás seguro de eliminar esta capa?',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.consolaAdministradorService.eliminarCapa(capaId.toString()).subscribe(
          (response) => {
            this.mostrarNotificacion('Capa eliminada con éxito. 🎉', 'success');
            // Refrescar la lista de capas
            this.obtenerCapas();
          },
          (error) => {
            this.mostrarNotificacion('Ocurrió un error al eliminar la capa.', 'error');
          }
        );
      }
    });
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'snack-success' : 'snack-error',
    });
  }
}
