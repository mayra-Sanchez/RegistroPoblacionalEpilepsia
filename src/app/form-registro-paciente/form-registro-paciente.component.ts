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
  
  formPaciente: FormGroup;
  mostrarConsentimiento = false;
  mostrarDatosClinicos = false;
  private signaturePad!: SignaturePad;

  @ViewChild('signatureCanvas') signaturePadElement!: ElementRef<HTMLCanvasElement>;

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private consolaService: ConsolaRegistroService
  ) {
    this.formPaciente = this.fb.group({
      name: ['', Validators.required],
      identificationType: ['', Validators.required],
      identificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      sex: ['', Validators.required],
      birthDate: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      deathDate: ['', Validators.required],
      economicStatus: ['', Validators.required],
      maritalStatus: ['', Validators.required],
      hometown: ['', Validators.required], 
      currentCity: ['', Validators.required],
      firstCrisisDate: ['', Validators.required],
      crisisStatus: ['', Validators.required],
      consentimiento: [false, Validators.requiredTrue],
      firma: ['', Validators.required]  
    });
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
  }

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
    console.log('Mostrando modal de consentimiento');
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

  onRegister() {
    if (this.formPaciente.invalid) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }

    const paciente = {
      name: this.formPaciente.value.name,
      identificationType: this.formPaciente.value.identificationType,
      identificationNumber: parseInt(this.formPaciente.value.identificationNumber, 10),
      sex: this.formPaciente.value.sex,
      birthDate: this.formatDate(this.formPaciente.value.birthDate),
      age: this.calculateAge(this.formPaciente.value.birthDate),
      email: this.formPaciente.value.email,
      phoneNumber: this.formPaciente.value.phoneNumber,
      deathDate: this.formPaciente.value.deathDate ? this.formatDate(this.formPaciente.value.deathDate) : null,
      economicStatus: this.formPaciente.value.economicStatus,
      maritalStatus: this.formPaciente.value.maritalStatus,
      hometown: this.formPaciente.value.hometown,
      currentCity: this.formPaciente.value.currentCity,
      firstCrisisDate: this.formatDate(this.formPaciente.value.firstCrisisDate),
      crisisStatus: this.formPaciente.value.crisisStatus,
      firma: this.formPaciente.value.firma
    };

    this.consolaService.registrarPaciente(paciente).subscribe({
      next: (response) => {
        console.log('Paciente registrado:', response);
        alert('Registro exitoso');
        this.formPaciente.reset();
        this.clearSignature();
      },
      error: (error) => {
        console.error('Error en el registro:', error);
        alert('Error al registrar paciente.');
      }
    });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD para LocalDate
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

  notasCampos: { [key: string]: { texto: string; historial: { fecha: Date; usuario: string; texto: string }[] } } = {};

  agregarNota(campo: string) {
    const textoActual = this.notasCampos[campo]?.texto || '';
    const nuevaNota = prompt(`Añadir/Editar nota para ${campo}:`, textoActual);
    if (nuevaNota !== null) {
      if (!this.notasCampos[campo]) {
        this.notasCampos[campo] = { texto: '', historial: [] };
      }
      this.notasCampos[campo].historial.push({ fecha: new Date(), usuario: 'Dr. Pérez', texto: nuevaNota });
      this.notasCampos[campo].texto = nuevaNota;
    }
  }

  verHistorialNotas(campo: string) {
    if (this.notasCampos[campo]?.historial.length) {
      console.log(`Historial de notas para ${campo}:`, this.notasCampos[campo].historial);
    } else {
      console.log(`No hay historial de notas para ${campo}.`);
    }
  }
}
