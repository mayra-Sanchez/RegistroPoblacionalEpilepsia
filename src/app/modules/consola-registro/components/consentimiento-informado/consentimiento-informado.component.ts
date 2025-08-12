import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';
import SignaturePad from 'signature_pad';

declare let pdfMake: any;

@Component({
  selector: 'app-consentimiento-informado',
  templateUrl: './consentimiento-informado.component.html',
  styleUrls: ['./consentimiento-informado.component.css']
})
export class ConsentimientoInformadoComponent implements AfterViewInit, OnDestroy {
  @Input() paciente: any;
  @Output() submitConsentimiento = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('signaturePad', { static: false }) signaturePadElement!: ElementRef;
  signaturePad!: SignaturePad;
  private isDrawing = false;

  consentimientoForm: FormGroup;
  showFirmaPaciente = false;
  showFirmaProfesional = false;
  currentSignatureType: 'paciente' | 'profesional' = 'paciente';
  pdfMakeLoaded = false;

  constructor(private fb: FormBuilder) {
    this.consentimientoForm = this.fb.group({
      nombrePaciente: ['', Validators.required],
      documentoPaciente: ['', Validators.required],
      firmaPaciente: ['', Validators.required],
      fechaPaciente: ['', Validators.required],
      nombreProfesional: ['', Validators.required],
      cargoProfesional: ['', Validators.required],
      firmaProfesional: ['', Validators.required],
      fechaProfesional: ['', Validators.required]
    });

    if (this.paciente) {
      this.consentimientoForm.patchValue({
        nombrePaciente: this.paciente.nombreCompleto || '',
        documentoPaciente: this.paciente.documento || ''
      });
    }

    this.loadPdfMake();
  }

  async loadPdfMake() {
    if (!this.pdfMakeLoaded) {
      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
      pdfMake = pdfMakeModule.default;
      pdfMake.vfs = pdfFontsModule.default;
      this.pdfMakeLoaded = true;
    }
  }

  ngAfterViewInit() {
    this.setupSignaturePad();
  }

  setupSignaturePad() {
    const canvas = this.signaturePadElement.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    // Ajustar tamaño del canvas
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    // Configuración del SignaturePad
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3,
      throttle: 16
    });

    // Manejar redimensionamiento
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  resizeCanvas() {
    const canvas = this.signaturePadElement.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    // Guardar la firma actual
    const data = this.signaturePad.toData();

    // Ajustar tamaño
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    // Restaurar la firma
    this.signaturePad.fromData(data);
  }

  // Métodos para manejar eventos táctiles
  onTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();

    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX - rect.left,
      clientY: touch.clientY - rect.top
    });
    this.signaturePadElement.nativeElement.dispatchEvent(mouseEvent);
  }

  onTouchMove(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();

    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX - rect.left,
      clientY: touch.clientY - rect.top
    });
    this.signaturePadElement.nativeElement.dispatchEvent(mouseEvent);
  }

  onTouchEnd() {
    const mouseEvent = new MouseEvent('mouseup');
    this.signaturePadElement.nativeElement.dispatchEvent(mouseEvent);
  }

  // Métodos para manejar eventos de mouse
  onMouseDown(e: MouseEvent) {
    this.isDrawing = true;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: e.clientX - rect.left,
      clientY: e.clientY - rect.top
    });
    this.signaturePadElement.nativeElement.dispatchEvent(mouseEvent);
  }

  onMouseMove(e: MouseEvent) {
    if (this.isDrawing) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: e.clientX - rect.left,
        clientY: e.clientY - rect.top
      });
      this.signaturePadElement.nativeElement.dispatchEvent(mouseEvent);
    }
  }

  onMouseUp() {
    this.isDrawing = false;
    const mouseEvent = new MouseEvent('mouseup');
    this.signaturePadElement.nativeElement.dispatchEvent(mouseEvent);
  }

  toggleFirmaPaciente() {
    this.currentSignatureType = 'paciente';
    this.showFirmaPaciente = true;
    this.showFirmaProfesional = false;
    setTimeout(() => {
      this.clearSignaturePad();
      this.setupSignaturePad();
    }, 0);
  }

  toggleFirmaProfesional() {
    this.currentSignatureType = 'profesional';
    this.showFirmaProfesional = true;
    this.showFirmaPaciente = false;
    setTimeout(() => {
      this.clearSignaturePad();
      this.setupSignaturePad();
    }, 0);
  }

  clearSignaturePad() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  closeModal() {
    this.showFirmaPaciente = false;
    this.showFirmaProfesional = false;
    this.clearSignaturePad();
  }

  limpiarFirma() {
    this.clearSignaturePad();
    if (this.currentSignatureType === 'paciente') {
      this.consentimientoForm.get('firmaPaciente')?.setValue('');
    } else {
      this.consentimientoForm.get('firmaProfesional')?.setValue('');
    }
  }

  confirmarFirma() {
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      const firma = this.signaturePad.toDataURL('image/png');
      const fecha = new Date().toISOString();

      if (this.currentSignatureType === 'paciente') {
        this.consentimientoForm.get('firmaPaciente')?.setValue(firma);
        this.consentimientoForm.get('fechaPaciente')?.setValue(fecha);
      } else {
        this.consentimientoForm.get('firmaProfesional')?.setValue(firma);
        this.consentimientoForm.get('fechaProfesional')?.setValue(fecha);
      }

      this.showFirmaPaciente = false;
      this.showFirmaProfesional = false;
    }
  }

  onSubmit() {
    if (this.consentimientoForm.valid) {
      this.submitConsentimiento.emit(this.consentimientoForm.value);
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  async generatePDF() {
    if (!this.pdfMakeLoaded) {
      await this.loadPdfMake();
    }

    const fechaActual = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
    const nombreArchivo = `Consentimiento_Informado_${fechaActual}.pdf`;

    const docDefinition = this.getDocDefinition();
    pdfMake.createPdf(docDefinition).download(nombreArchivo);
  }

  private getDocDefinition() {
    const formValue = this.consentimientoForm.value;

    return {
      content: [
        {
          text: 'CONSENTIMIENTO INFORMADO PARA EL TRATAMIENTO DE DATOS PERSONALES',
          style: 'header',
          alignment: 'center'
        },
        {
          text: 'Proyecto: Registro de Pacientes con Epilepsia (RPE) – Piloto',
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          text: 'Responsable del tratamiento de datos: Universidad del Valle',
          margin: [0, 0, 0, 5]
        },
        {
          text: 'Correo de contacto: soporte.registroepilepsia@gmail.com',
          margin: [0, 0, 0, 5]
        },
        {
          text: 'Teléfono: 3026929375',
          margin: [0, 0, 0, 20]
        },
        {
          text: '1. Finalidad del tratamiento de datos',
          style: 'sectionHeader'
        },
        {
          text: 'En cumplimiento de la Ley 1581 de 2012 y sus decretos reglamentarios, informo que los datos personales recolectados a través de este registro serán utilizados exclusivamente para:',
          margin: [0, 0, 0, 10]
        },
        {
          ul: [
            'Llevar un registro clínico y estadístico de pacientes con epilepsia.',
            'Analizar información para fines académicos y de investigación en el marco de mi trabajo de grado.',
            'Elaborar reportes agregados para mejorar la atención y el seguimiento médico.'
          ],
          margin: [0, 0, 0, 10]
        },
        {
          text: 'Los datos no serán compartidos con terceros no autorizados y serán tratados con estricta confidencialidad.',
          margin: [0, 0, 0, 20]
        },
        {
          text: '2. Derechos del titular de los datos',
          style: 'sectionHeader'
        },
        {
          text: 'Como paciente, usted tiene derecho a:',
          margin: [0, 0, 0, 10]
        },
        {
          ul: [
            'Conocer, actualizar y rectificar sus datos.',
            'Revocar la autorización y/o solicitar la supresión de sus datos.',
            'Acceder de forma gratuita a los datos personales que hayan sido objeto de tratamiento.'
          ],
          margin: [0, 0, 0, 10]
        },
        {
          text: 'Para ejercer estos derechos puede escribir al correo indicado en este documento.',
          margin: [0, 0, 0, 20]
        },
        {
          text: '3. Declaración de consentimiento',
          style: 'sectionHeader'
        },
        {
          text: 'Declaro que he leído y comprendido la información anterior, y que otorgo de manera libre, expresa, voluntaria e informada mi autorización para que mis datos personales y clínicos sean recolectados, almacenados y tratados con las finalidades aquí descritas.',
          margin: [0, 0, 0, 20]
        },
        {
          text: 'Datos del paciente o representante legal',
          style: 'sectionHeader'
        },
        {
          text: `Nombre completo: ${formValue.nombrePaciente}`,
          margin: [0, 0, 0, 5]
        },
        {
          text: `Tipo y número de documento: ${formValue.documentoPaciente}`,
          margin: [0, 0, 0, 5]
        },
        {
          text: 'Firma:',
          margin: [0, 10, 0, 5]
        },
        {
          image: formValue.firmaPaciente,
          width: 150,
          margin: [0, 0, 0, 5]
        },
        {
          text: `Fecha: ${formatDate(formValue.fechaPaciente, 'dd/MM/yyyy', 'en-US')}`,
          margin: [0, 0, 0, 20]
        },
        {
          text: 'Datos del profesional de salud',
          style: 'sectionHeader'
        },
        {
          text: `Nombre completo: ${formValue.nombreProfesional}`,
          margin: [0, 0, 0, 5]
        },
        {
          text: `Cargo / Especialidad: ${formValue.cargoProfesional}`,
          margin: [0, 0, 0, 5]
        },
        {
          text: 'Firma:',
          margin: [0, 10, 0, 5]
        },
        {
          image: formValue.firmaProfesional,
          width: 150,
          margin: [0, 0, 0, 5]
        },
        {
          text: `Fecha: ${formatDate(formValue.fechaProfesional, 'dd/MM/yyyy', 'en-US')}`,
          margin: [0, 0, 0, 20]
        },
        {
          text: '📌 Nota: Este documento debe almacenarse junto con el registro del paciente la primera vez',
          style: 'note',
          margin: [0, 20, 0, 0]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true
        },
        subheader: {
          fontSize: 14,
          bold: true
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        note: {
          fontSize: 10,
          italics: true
        }
      },
      defaultStyle: {
        fontSize: 12
      }
    };
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }
}