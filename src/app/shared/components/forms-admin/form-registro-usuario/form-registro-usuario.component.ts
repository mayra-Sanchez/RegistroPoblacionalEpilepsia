import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-form-registro-usuario',
  templateUrl: './form-registro-usuario.component.html',
  styleUrls: ['./form-registro-usuario.component.css']
})
export class FormRegistroUsuarioComponent implements OnInit {
  @Output() usuarioCreada = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  usuarioForm: FormGroup;
  capas: any[] = [];
  showPassword: boolean = false;
  sugerenciasUsername: string[] = [];

  roles = [
    { valor: 'Admin', label: 'Administrador', descripcion: 'Puede gestionar usuarios, capas y variables.' },
    { valor: 'Researcher', label: 'Investigador', descripcion: 'Puede investigar datos clínicos de una capa.' },
    { valor: 'Doctor', label: 'Personal de salud', descripcion: 'Puede registrar pacientes y ver reportes.' },
    { valor: 'SuperAdmin', label: 'Super administrador', descripcion: 'Administración completa del sistema.' }
  ];

  constructor(private consolaAdministradorService: ConsolaAdministradorService) {
    this.usuarioForm = new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      tipoDocumento: new FormControl('', [Validators.required]),
      numeroDocumento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      fechaNacimiento: new FormControl('', [Validators.required]),
      rol: new FormControl('', [Validators.required]),
      username: new FormControl('', [Validators.required]),
      capaInvestigacion: new FormControl([], [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$')
      ]),
      acceptTermsAndConditions: new FormControl(false, [Validators.requiredTrue])
    });

    // Generar sugerencias de username al cambiar nombre, apellido o fecha
    this.usuarioForm.get('nombre')?.valueChanges.subscribe(() => this.generarSugerenciasUsername());
    this.usuarioForm.get('apellido')?.valueChanges.subscribe(() => this.generarSugerenciasUsername());
    this.usuarioForm.get('fechaNacimiento')?.valueChanges.subscribe(() => this.generarSugerenciasUsername());
  }

  ngOnInit(): void {
    this.obtenerCapas();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  obtenerCapas() {
    this.consolaAdministradorService.getAllLayers().subscribe(
      (capas) => {
        const capasMapeadas = capas.map(capa => ({
          id: capa.id,
          nombreCapa: capa.layerName || capa.nombreCapa
        }));
        this.capas = [{ id: 'none', nombreCapa: 'Ninguna' }, ...capasMapeadas];
      },
      (error) => {
        console.error('Error al obtener capas:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar las capas de investigación.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    );
  }

  generarSugerenciasUsername(): void {
    const nombre = this.usuarioForm.get('nombre')?.value;
    const apellido = this.usuarioForm.get('apellido')?.value;
    const fechaNacimiento = this.usuarioForm.get('fechaNacimiento')?.value;

    if (nombre && apellido && fechaNacimiento) {
      this.sugerenciasUsername = this.generarUsernameSugerencias(nombre, apellido, fechaNacimiento);
      this.usuarioForm.get('username')?.setValue(this.sugerenciasUsername[0]);
    }
  }

  generarUsernameSugerencias(nombre: string, apellido: string, fechaNacimiento: string): string[] {
    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const nombreLimpio = normalize(nombre.trim());
    const apellidoLimpio = normalize(apellido.trim());
    const anio = fechaNacimiento?.slice(0, 4) || '';
    const diaMes = fechaNacimiento?.slice(5, 10).replace('-', '') || '';

    const base = `${nombreLimpio.charAt(0)}${apellidoLimpio}`;
    const random = () => Math.floor(100 + Math.random() * 900);

    return [
      `${base}`,
      `${base}${anio}`,
      `${base}${diaMes}`,
      `${base}${anio}${random()}`,
      `${nombreLimpio}.${apellidoLimpio}`,
      `${nombreLimpio}.${apellidoLimpio}${random()}`,
      `${nombreLimpio}_${apellidoLimpio}`,
      `${apellidoLimpio}${random()}`
    ];
  }

  onRegister() {
    if (this.usuarioForm.invalid) {
      Swal.fire({
        title: 'Formulario inválido',
        text: 'Por favor, complete todos los campos correctamente.',
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    const { nombre, apellido, email, username, password, tipoDocumento, numeroDocumento, fechaNacimiento, capaInvestigacion, rol, acceptTermsAndConditions } = this.usuarioForm.value;

    const usuarioData = {
      firstName: nombre,
      lastName: apellido,
      email,
      username,
      password,
      identificationType: tipoDocumento,
      identificationNumber: String(numeroDocumento),
      birthDate: fechaNacimiento,
      researchLayer: capaInvestigacion.length ? capaInvestigacion : ['none'],
      role: rol,
      acceptTermsAndConditions
    };

    Swal.fire({
      title: '¿Registrar usuario?',
      text: '¿Estás seguro de registrar este usuario?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consolaAdministradorService.crearUsuario(usuarioData).subscribe(
          () => {
            Swal.fire({
              title: '¡Registro exitoso!',
              text: 'El usuario ha sido registrado correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
            this.usuarioForm.reset();
            this.usuarioCreada.emit();
          },
          (error) => {
            console.error('Error al registrar usuario:', error);
            let mensaje = 'Hubo un problema inesperado al registrar el usuario.';

            if (error?.error?.message) {
              mensaje = error.error.message;
            } else if (error?.error?.errors && Array.isArray(error.error.errors)) {
              mensaje = error.error.errors.map((e: any) => e.msg || e.message || 'Error desconocido').join('\n');
            } else if (error?.message) {
              mensaje = error.message;
            }

            Swal.fire({
              title: 'Error al registrar',
              text: mensaje,
              icon: 'error',
              confirmButtonText: 'Aceptar'
            });
          }
        );
      }
    });
  }

  onCancel() {
    Swal.fire({
      title: '¿Cancelar registro?',
      text: '¿Estás seguro de que deseas cancelar el registro?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Continuar editando'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cancelar.emit();
      }
    });
  }

  campoEsValido(campo: string): boolean {
    const control = this.usuarioForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  seleccionarUsername(sugerencia: string) {
    this.usuarioForm.get('username')?.setValue(sugerencia);
  }

  onToggleCapaSeleccionada(capaId: string): void {
    const control = this.usuarioForm.get('capaInvestigacion');
    if (!control) return;

    const valores = control.value || [];
    const index = valores.indexOf(capaId);

    if (index === -1) {
      control.setValue([...valores, capaId]);
    } else {
      control.setValue(valores.filter((id: string) => id !== capaId));
    }
    control.markAsTouched();
  }
}
