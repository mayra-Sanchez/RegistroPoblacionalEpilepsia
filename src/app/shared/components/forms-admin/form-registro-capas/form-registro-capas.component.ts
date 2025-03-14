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
  capas: any[] = [];
  editando: boolean = false;
  capaIdSeleccionada: string | null = null;
  private capasSubscription: Subscription = Subscription.EMPTY;

  constructor(
    private fb: FormBuilder,
    private consolaAdministradorService: ConsolaAdministradorService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.obtenerCapas();
  }

  ngOnDestroy(): void {
    if (this.capasSubscription) {
      this.capasSubscription.unsubscribe();
    }
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      nombreCapa: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(5)]],
      jefeCapa: this.fb.group({
        id: [1, Validators.required],
        nombre: ['', [Validators.required, Validators.minLength(3)]],
        numeroIdentificacion: ['', [Validators.required, Validators.minLength(5)]],
      }),
    });
  }

  obtenerCapas(): void {
    this.capasSubscription = this.consolaAdministradorService.getAllLayers().subscribe(
      (capas) => {
        this.capas = capas;
        this.cdRef.detectChanges();
      },
      () => {
        this.mostrarNotificacion('Error al obtener las capas.', 'error');
      }
    );
  }

  registrarCapa(): void {
    console.log('⏳ Intentando registrar capa...');
  
    if (this.form.valid) {
      const capaData = {
        // id: this.form.value.id || null,
        nombreCapa: this.form.value.nombreCapa?.trim(),
        descripcion: this.form.value.descripcion?.trim(),
        jefeCapa: {
          id: 1,
          nombre: this.form.value.jefeCapa?.nombre?.trim(),
          numeroIdentificacion: this.form.value.jefeCapa?.numeroIdentificacion?.trim() || 'N/A',
        },
      };
  
      console.log('📤 Enviando datos:', capaData);
  
      this.consolaAdministradorService.registrarCapa(capaData).subscribe(
        (response) => {
          console.log('✅ Capa registrada con éxito:', response);
          this.mostrarNotificacion('Capa registrada con éxito. 🎉', 'success');
          this.form.reset();
        },
        (error) => {
          console.error('❌ Error al registrar capa:', error);
          this.mostrarNotificacion('Ocurrió un error al registrar la capa.', 'error');
        }
      );
    } else {
      console.warn('⚠️ El formulario no es válido:', this.form.value);
      this.form.markAllAsTouched();
    }
  }
  

  actualizarCapa(): void {
    if (this.form.invalid || !this.capaIdSeleccionada) {
      this.form.markAllAsTouched();
      this.mostrarNotificacion('Error: No se seleccionó una capa para actualizar.', 'error');
      return;
    }
  
    const capaData = this.form.value;
  
    const dialogRef = this.dialog.open(ModalConfirmacionComponent, {
      width: '400px',
      panelClass: 'custom-modal',
      data: { titulo: 'Confirmar Actualización', mensaje: '¿Estás seguro de actualizar esta capa?' }
    });
  
    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.consolaAdministradorService.actualizarCapa(this.capaIdSeleccionada as string, capaData).subscribe(
          () => {
            this.mostrarNotificacion('Capa actualizada con éxito. 🎉', 'success');
            this.resetFormulario();
            this.obtenerCapas();
          },
          () => {
            this.mostrarNotificacion('Error al actualizar la capa.', 'error');
          }
        );
      }
    });
  }  

  eliminarCapa(capaId: string): void {
    const dialogRef = this.dialog.open(ModalConfirmacionComponent, {
      width: '400px',
      panelClass: 'custom-modal',
      data: { titulo: 'Confirmar Eliminación', mensaje: '¿Estás seguro de eliminar esta capa?' }
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.consolaAdministradorService.eliminarCapa(capaId).subscribe(
          () => {
            this.mostrarNotificacion('Capa eliminada con éxito. 🎉', 'success');
            this.obtenerCapas();
          },
          () => {
            this.mostrarNotificacion('Error al eliminar la capa.', 'error');
          }
        );
      }
    });
  }

  cargarDatosParaEditar(capa: any): void {
    this.form.patchValue({
      nombreCapa: capa.nombreCapa,
      descripcion: capa.descripcion,
      jefeCapa: {
        id: capa.jefeCapa?.id || null,
        nombre: capa.jefeCapa?.nombre || '',
        numeroIdentificacion: capa.jefeCapa?.numeroIdentificacion || '',
      }
    });
    this.capaIdSeleccionada = capa.id;
    this.editando = true;
  }

  resetFormulario(): void {
    this.form.reset();
    this.capaIdSeleccionada = null;
    this.editando = false;
  }

  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: tipo === 'success' ? 'snack-success' : 'snack-error',
    });
  }
}
