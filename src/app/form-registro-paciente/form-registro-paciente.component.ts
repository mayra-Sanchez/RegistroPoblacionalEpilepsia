import { Component, ViewChild, AfterViewInit, AfterViewChecked, ElementRef, ChangeDetectorRef } from '@angular/core';
import SignaturePad from 'signature_pad';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsolaRegistroService } from '../modules/consola-registro/services/consola-registro.service';

@Component({
  selector: 'app-form-registro-paciente',
  templateUrl: './form-registro-paciente.component.html',
  styleUrls: ['./form-registro-paciente.component.css']
})
export class FormRegistroPacienteComponent implements AfterViewInit, AfterViewChecked {

  formPaciente: FormGroup = this.fb.group({});
  formClinico: FormGroup = this.fb.group({});
  formCuidador: FormGroup = this.fb.group({});
  formProfesional: FormGroup = this.fb.group({});

  mostrarConsentimiento = false;
  mostrarDatosClinicos = false;
  mostrarDatosCuidador = false;
  mostrarDatosProfesional = false;
  private signaturePad!: SignaturePad;

  capas = ['Capa 1', 'Capa 2', 'Capa 3'];
  pasoActual = 1;
  variables: any[] = [];

  @ViewChild('signatureCanvas') signaturePadElement!: ElementRef<HTMLCanvasElement>;

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private consolaService: ConsolaRegistroService
  ) {
    this.inicializarFormularios();
  }

  inicializarFormularios() {
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
      firma: ['', Validators.required]
    });

    this.formClinico = this.fb.group({
      capa: ['', Validators.required],
      variablesClinicas: this.fb.array([])
    });

    this.formCuidador = this.fb.group({
      caregiverName: ['', Validators.required],
      caregiverIdentificationType: ['', Validators.required],
      caregiverIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      caregiverAge: ['', [Validators.required, Validators.min(1)]],
      caregiverEducationLevel: ['', Validators.required],
      caregiverOccupation: ['', Validators.required]
    });

    this.formProfesional = this.fb.group({
      healthProfessionalId: ['', Validators.required],
      healthProfessionalName: ['', Validators.required],
      healthProfessionalIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]]
    });
  }

  isFormularioCompleto(): boolean {
    return (
      this.formPaciente.valid &&
      this.formClinico.valid &&
      this.formCuidador.valid &&
      this.formProfesional.valid
    );
  }

  onRegister() {
    if (!this.isFormularioCompleto()) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }
  
    const requestData = {
      variables: this.variables,
      patient: {
        ...this.formPaciente.value,
        deathDate: this.formPaciente.value.deathDate ? this.formatDate(this.formPaciente.value.deathDate) : 'No aplica'
      },
      clinical: this.formClinico.value,
      caregiver: this.formCuidador.value,
      healthProfessional: this.formProfesional.value
    };
  
    this.consolaService.registrarRegistro(requestData).subscribe({
      next: (response: any) => {
        console.log('Registro exitoso:', response);
        alert('Registro exitoso');
        this.formPaciente.reset();
        this.formClinico.reset();
        this.formCuidador.reset();
        this.formProfesional.reset();
        this.clearSignature();
      },
      error: (error: any) => {
        console.error('Error en el registro:', error);
        alert('Error al registrar.');
      }
    });
  }
  

  ngAfterViewInit() { }

  ngAfterViewChecked() {
    if (this.signaturePadElement && !this.signaturePad) {
      this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement, {
        minWidth: 1,
        maxWidth: 3,
        penColor: 'black',
        backgroundColor: 'white'
      });
    }
  }

  clearSignature() {
    this.signaturePad.clear();
  }

  onConsentimiento() {
    this.mostrarConsentimiento = true;
  }

  saveSignature() {
    if (this.signaturePad.isEmpty()) {
      alert('Por favor, firma antes de continuar.');
      return;
    }
    this.formPaciente.patchValue({ firma: this.signaturePad.toDataURL() });
    this.mostrarConsentimiento = false;
  }

  onDatosClinicos() {
    if (!this.formPaciente.get('consentimiento')?.value) {
      alert('Debe aceptar el consentimiento informado antes de continuar.');
      return;
    }
    this.mostrarDatosClinicos = true;
  }

  cargarVariables() {
    // Lógica para cargar las variables según la capa seleccionada
    const capaSeleccionada = this.formPaciente.get('capa')?.value;
    if (capaSeleccionada) {
      this.consolaService.obtenerVariablesPorCapa(capaSeleccionada).subscribe((data) => {
        this.variables = data;
      });
    }
  }

  onDatosCuidador() {
    if (this.formPaciente.get('capa')?.invalid) {
      alert('Debe seleccionar una capa antes de continuar.');
      return;
    }
    this.mostrarDatosCuidador = true;
  }

  onDatosProfesional() {
    this.mostrarDatosProfesional = true;
  }

  // onRegister() {
  //   if (this.formPaciente.invalid) {
  //     alert('Por favor, complete todos los campos obligatorios.');
  //     return;
  //   }

  //   const requestData = {
  //     variables: this.variables, // Enviar las variables clínicas seleccionadas
  //     patient: {
  //       name: this.formPaciente.value.name,
  //       identificationType: this.formPaciente.value.identificationType,
  //       identificationNumber: parseInt(this.formPaciente.value.identificationNumber, 10),
  //       sex: this.formPaciente.value.sex,
  //       birthDate: this.formatDate(this.formPaciente.value.birthDate),
  //       age: this.calculateAge(this.formPaciente.value.birthDate),
  //       email: this.formPaciente.value.email,
  //       phoneNumber: this.formPaciente.value.phoneNumber,
  //       deathDate: this.formPaciente.value.deathDate ? this.formatDate(this.formPaciente.value.deathDate) : null,
  //       economicStatus: this.formPaciente.value.economicStatus,
  //       educationLevel: this.formPaciente.value.educationLevel,
  //       maritalStatus: this.formPaciente.value.maritalStatus,
  //       hometown: this.formPaciente.value.hometown,
  //       currentCity: this.formPaciente.value.currentCity,
  //       firstCrisisDate: this.formatDate(this.formPaciente.value.firstCrisisDate),
  //       crisisStatus: this.formPaciente.value.crisisStatus
  //     },
  //     caregiver: {
  //       name: this.formPaciente.value.caregiverName,
  //       identificationType: this.formPaciente.value.caregiverIdentificationType,
  //       identificationNumber: parseInt(this.formPaciente.value.caregiverIdentificationNumber, 10),
  //       age: parseInt(this.formPaciente.value.caregiverAge, 10),
  //       educationLevel: this.formPaciente.value.caregiverEducationLevel,
  //       occupation: this.formPaciente.value.caregiverOccupation
  //     },
  //     healthProfessional: {
  //       id: this.formPaciente.value.healthProfessionalId,
  //       name: this.formPaciente.value.healthProfessionalName,
  //       identificationNumber: parseInt(this.formPaciente.value.healthProfessionalIdentificationNumber, 10)
  //     }
  //   };

  //   this.consolaService.registrarRegistro(requestData).subscribe({
  //     next: (response: any) => {
  //       console.log('Registro exitoso:', response);
  //       alert('Registro exitoso');
  //       this.formPaciente.reset();
  //       this.clearSignature();
  //     },
  //     error: (error: any) => {
  //       console.error('Error en el registro:', error);
  //       alert('Error al registrar.');
  //     }
  //   });
  // }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  private calculateAge(dateString: string): number {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Métodos para avanzar y retroceder en el formulario por pasos
  siguientePaso() {
    this.pasoActual++;
  }

  pasoAnterior() {
    this.pasoActual--;
  }
}
