import { Component, ViewChild, AfterViewInit, AfterViewChecked, ElementRef, ChangeDetectorRef  } from '@angular/core';
import SignaturePad from 'signature_pad';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-form-registro-paciente',
  templateUrl: './form-registro-paciente.component.html',
  styleUrls: ['./form-registro-paciente.component.css']
})
export class FormRegistroPacienteComponent implements AfterViewInit, AfterViewChecked {
  // usuario = {
  //   nombre: '',
  //   apellido: '',
  //   tipoDocumento: '',
  //   numeroDocumento: '',
  //   fechaNacimiento: '',
  //   email: '',
  //   fechaRegistro: '',
  //   fechaMuerte: '',
  //   numeroTelefonico: '',
  //   consentimiento: false,
  //   fechaConsentimiento: '',
  //   firma: ''
  // };

  formPaciente: FormGroup;

  constructor(private cdr: ChangeDetectorRef,private fb: FormBuilder) {
    this.formPaciente = this.fb.group({
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      sexo: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      numeroTelefonico: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      fechaRegistro: ['', Validators.required],
      fechaMuerte: [''],
      consentimiento: [false, Validators.requiredTrue],
      firma: ['', Validators.required]  
    });
  }

  mostrarConsentimiento = false;
  mostrarDatosClinicos = false;

  private signaturePad!: SignaturePad;

  @ViewChild('signatureCanvas') signaturePadElement!: ElementRef<HTMLCanvasElement>;

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
    console.log('Usuario registrado:', this.formPaciente.value);
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
