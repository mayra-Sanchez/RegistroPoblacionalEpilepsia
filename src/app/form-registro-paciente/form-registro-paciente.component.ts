import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ConsolaRegistroService } from '../modules/consola-registro/services/consola-registro.service';
import { AuthService } from 'src/app/login/services/auth.service';
import SignaturePad from 'signature_pad';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-form-registro-paciente',
  templateUrl: './form-registro-paciente.component.html',
  styleUrls: ['./form-registro-paciente.component.css']
})
export class FormRegistroPacienteComponent implements OnInit {
  @ViewChild('signatureCanvas') signaturePadElement!: ElementRef<HTMLCanvasElement>;
  private signaturePad!: SignaturePad;

  // Formularios principales
  formPaciente: FormGroup;
  formClinico: FormGroup;
  formCuidador: FormGroup;
  formProfesional: FormGroup;

  // Estado del formulario
  pasoActual = 1;
  mostrarConsentimiento = false;
  tieneCuidador = false;

  // Variables dinámicas
  variablesDeCapa: any[] = [];
  currentResearchLayer: any = null;
  loadingVariables = false;

  constructor(
    private fb: FormBuilder,
    private consolaService: ConsolaRegistroService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.formPaciente = this.fb.group({
      name: ['', Validators.required],
      identificationType: ['', Validators.required],
      identificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      sex: ['', Validators.required],
      birthDate: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      deathDate: [''],
      economicStatus: ['', Validators.required],
      educationLevel: ['', Validators.required],
      maritalStatus: ['', Validators.required],
      hometown: ['', Validators.required],
      currentCity: ['', Validators.required],
      firstCrisisDate: ['', Validators.required],
      crisisStatus: ['', Validators.required],
      consentimiento: [false, Validators.requiredTrue],
      firma: ['', Validators.required],
      tieneCuidador: [false]
    });

    this.formClinico = this.fb.group({
      variablesClinicas: this.fb.array([])
    });

    this.formCuidador = this.fb.group({
      caregiverName: [''],
      caregiverIdentificationType: [''],
      caregiverIdentificationNumber: ['', [Validators.pattern('^[0-9]+$')]],
      caregiverAge: ['', [Validators.min(1)]],
      caregiverEducationLevel: [''],
      caregiverOccupation: ['']
    });

    this.formProfesional = this.fb.group({
      healthProfessionalId: ['', Validators.required],
      healthProfessionalName: ['', Validators.required],
      healthProfessionalIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]]
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.formPaciente.get('tieneCuidador')?.valueChanges.subscribe(value => {
      console.log('Valor de tieneCuidador:', value);
      this.toggleCuidadorValidators(value);
      this.cdr.detectChanges(); // Forzar actualización de la vista
    });
  }

  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    });
  }

  loadUserData() {
    const email = this.authService.getUserEmail();
    if (!email) {
      console.error('No se pudo obtener el email del usuario');
      return;
    }

    this.consolaService.obtenerUsuarioAutenticado(email).subscribe({
      next: (response) => {
        if (!response?.[0]) {
          console.error('Respuesta del servicio inválida');
          return;
        }

        const researchLayerName = response[0]?.attributes?.researchLayerId?.[0];
        if (researchLayerName) {
          this.consolaService.buscarCapaPorNombre(researchLayerName).subscribe({
            next: (capa) => {
              this.currentResearchLayer = capa;
              if (capa.id) {
                this.loadVariablesDeCapa(capa.id);
              }
            },
            error: (err) => console.error('Error al obtener la capa:', err)
          });
        }
      },
      error: (err) => console.error('Error al cargar usuario:', err)
    });
  }

  loadVariablesDeCapa(researchLayerId: string) {
    this.loadingVariables = true;
    this.variablesDeCapa = [];

    this.consolaService.obtenerVariablesPorCapa(researchLayerId).subscribe({
      next: (variables) => {
        this.variablesDeCapa = variables.filter(v => v.isEnabled);
        this.loadingVariables = false;
        this.actualizarFormularioClinico();
      },
      error: (err) => {
        console.error('Error al cargar variables:', err);
        this.loadingVariables = false;
        alert('Error al cargar las variables clínicas. Por favor, intente nuevamente.');
      }
    });
  }

  actualizarFormularioClinico() {
    const variablesArray = this.formClinico.get('variablesClinicas') as FormArray;
    variablesArray.clear();

    this.variablesDeCapa.forEach(variable => {
      const group = this.fb.group({
        id: [variable.id],
        variableName: [variable.variableName],
        description: [variable.description],
        type: [variable.type],
        hasOptions: [variable.hasOptions],
        options: [variable.options || []],
        valor: [null, Validators.required]
      });

      variablesArray.push(group);
    });

    this.cdr.detectChanges();
  }

  get variablesClinicasFormArray() {
    return this.formClinico.get('variablesClinicas') as FormArray;
  }

  toggleCuidadorValidators(tieneCuidador: boolean) {
    const camposCuidador = [
      'caregiverName',
      'caregiverIdentificationType',
      'caregiverIdentificationNumber',
      'caregiverAge',
      'caregiverEducationLevel',
      'caregiverOccupation'
    ];

    camposCuidador.forEach(campo => {
      const control = this.formCuidador.get(campo);
      if (tieneCuidador) {
        // Añadir validadores requeridos
        if (campo === 'caregiverIdentificationNumber') {
          control?.setValidators([Validators.required, Validators.pattern('^[0-9]+$')]);
        } else if (campo === 'caregiverAge') {
          control?.setValidators([Validators.required, Validators.min(1)]);
        } else {
          control?.setValidators([Validators.required]);
        }
      } else {
        // Remover validadores requeridos
        if (campo === 'caregiverIdentificationNumber') {
          control?.setValidators([Validators.pattern('^[0-9]+$')]);
        } else if (campo === 'caregiverAge') {
          control?.setValidators([Validators.min(1)]);
        } else {
          control?.clearValidators();
        }
        control?.reset();
      }
      control?.updateValueAndValidity();
    });
    this.cdr.detectChanges(); // Forzar actualización de la vista
  }


  siguientePaso() {
    if (this.pasoActual === 1 && !this.formPaciente.valid) {
      alert('Por favor complete todos los campos obligatorios del paciente');
      return;
    }
    if (this.pasoActual === 2 && !this.formClinico.valid) {
      alert('Por favor complete todos los campos clínicos obligatorios');
      return;
    }
    if (this.pasoActual === 3 && this.tieneCuidador && !this.formCuidador.valid) {
      alert('Por favor complete todos los campos del cuidador');
      return;
    }

    this.pasoActual++;
  }

  pasoAnterior() {
    this.pasoActual--;
  }

  clearSignature() {
    if (this.signaturePad) {
      this.signaturePad.clear();
      this.formPaciente.patchValue({ firma: '' });
    }
  }

  saveSignature() {
    if (this.signaturePad.isEmpty()) {
      alert('Por favor, firma antes de continuar.');
      return;
    }
    this.formPaciente.patchValue({
      firma: this.signaturePad.toDataURL(),
      consentimiento: true
    });
    this.mostrarConsentimiento = false;
  }

  onConsentimiento() {
    this.mostrarConsentimiento = true;
  }

  onDatosClinicos() {
    if (!this.formPaciente.get('consentimiento')?.value) {
      alert('Debe aceptar el consentimiento informado antes de continuar.');
      return;
    }
    this.pasoActual = 2; // Navega al paso de datos clínicos
  }

  onRegister() {
    if (!this.isFormularioCompleto()) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }

    const formData = {
      patient: { ...this.formPaciente.value },
      clinicalData: {
        researchLayerId: this.currentResearchLayer?.id,
        variables: this.variablesClinicasFormArray.controls.map(control => ({
          id: control.get('id')?.value,
          variableName: control.get('variableName')?.value,
          value: control.get('valor')?.value,
          type: control.get('type')?.value
        }))
      },
      caregiver: this.tieneCuidador ? this.formCuidador.value : null,
      healthProfessional: this.formProfesional.value
    };

    // Limpiar datos si no tiene cuidador
    if (!this.tieneCuidador) {
      formData.caregiver = null;
    }

    this.consolaService.registrarRegistro(formData).subscribe({
      next: (response) => {
        console.log('Registro exitoso', response);
        this.resetForms();
        alert('Registro completado con éxito');
      },
      error: (error) => {
        console.error('Error en el registro', error);
        alert('Error al registrar los datos');
      }
    });
  }

  isFormularioCompleto(): boolean {
    const pacienteValido = this.formPaciente.valid;
    const clinicoValido = this.formClinico.valid;
    const profesionalValido = this.formProfesional.valid;
    const cuidadorValido = !this.tieneCuidador || this.formCuidador.valid;

    return pacienteValido && clinicoValido && profesionalValido && cuidadorValido;
  }

  resetForms() {
    this.formPaciente.reset();
    this.formClinico.reset();
    this.formCuidador.reset();
    this.formProfesional.reset();
    this.clearSignature();
    this.pasoActual = 1;
    this.tieneCuidador = false;
  }

  getInputType(variableType: string): string {
    const typeMap: { [key: string]: string } = {
      'Entero': 'number',
      'Real': 'number',
      'Decimal': 'number',
      'Cadena': 'text',
      'Texto': 'text',
      'Fecha': 'date',
      'Lógico': 'checkbox',
      'Booleano': 'checkbox',
      'Opciones': 'select'
    };
    return typeMap[variableType] || 'text';
  }
}