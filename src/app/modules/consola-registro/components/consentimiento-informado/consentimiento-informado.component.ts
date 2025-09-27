import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { formatDate } from '@angular/common';
import SignaturePad from 'signature_pad';

// Declaración global para pdfMake
declare let pdfMake: any;

/**
 * Componente para el manejo de consentimientos informados
 * Permite la captura de firmas digitales y generación de PDF
 */
@Component({
  selector: 'app-consentimiento-informado',
  templateUrl: './consentimiento-informado.component.html',
  styleUrls: ['./consentimiento-informado.component.css']
})
export class ConsentimientoInformadoComponent implements AfterViewInit, OnDestroy {
  //#region Input Properties
  /** Datos del paciente para prellenar el formulario */
  @Input() paciente: any;
  //#endregion

  //#region Output Events
  /** Evento emitido al enviar el consentimiento */
  @Output() submitConsentimiento = new EventEmitter<any>();
  
  /** Evento emitido al cancelar el proceso */
  @Output() cancel = new EventEmitter<void>();
  //#endregion

  //#region ViewChild References
  /** Referencia al elemento del pad de firma */
  @ViewChild('signaturePad', { static: false }) signaturePadElement!: ElementRef;
  //#endregion

  //#region Propiedades del Componente
  /** Instancia del SignaturePad para manejar firmas */
  signaturePad!: SignaturePad;
  
  /** Indica si el usuario está dibujando */
  private isDrawing = false;

  /** Formulario reactivo para el consentimiento */
  consentimientoForm: FormGroup;

  /** Controla la visibilidad del modal de firma del paciente */
  showFirmaPaciente = false;
  
  /** Controla la visibilidad del modal de firma del profesional */
  showFirmaProfesional = false;
  
  /** Tipo de firma actual (paciente o profesional) */
  currentSignatureType: 'paciente' | 'profesional' = 'paciente';
  
  /** Indica si pdfMake está cargado */
  pdfMakeLoaded = false;
  //#endregion

  //#region Constructor e Inicialización
  /**
   * Constructor del componente
   * @param fb FormBuilder para crear formularios reactivos
   */
  constructor(private fb: FormBuilder) {
    // Inicializar el formulario con validadores
    this.consentimientoForm = this.createConsentimientoForm();
    
    // Precargar datos del paciente si están disponibles
    this.prefillPacienteData();
    
    // Cargar pdfMake de forma asíncrona
    this.loadPdfMake();
  }

  /**
   * Crea el formulario reactivo para el consentimiento
   */
  private createConsentimientoForm(): FormGroup {
    return this.fb.group({
      nombrePaciente: ['', Validators.required],
      documentoPaciente: ['', Validators.required],
      firmaPaciente: ['', Validators.required],
      fechaPaciente: ['', Validators.required],
      nombreProfesional: ['', Validators.required],
      cargoProfesional: ['', Validators.required],
      firmaProfesional: ['', Validators.required],
      fechaProfesional: ['', Validators.required]
    });
  }

  /**
   * Precarga los datos del paciente en el formulario si están disponibles
   */
  private prefillPacienteData(): void {
    if (this.paciente) {
      this.consentimientoForm.patchValue({
        nombrePaciente: this.paciente.nombreCompleto || '',
        documentoPaciente: this.paciente.documento || ''
      });
    }
  }

  /**
   * Carga la librería pdfMake de forma asíncrona
   */
  async loadPdfMake(): Promise<void> {
    if (!this.pdfMakeLoaded) {
      try {
        const pdfMakeModule = await import('pdfmake/build/pdfmake');
        const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
        pdfMake = pdfMakeModule.default;
        pdfMake.vfs = pdfFontsModule.default;
        this.pdfMakeLoaded = true;
      } catch (error) {
        console.error('Error al cargar pdfMake:', error);
      }
    }
  }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Inicialización después de que la vista esté disponible
   */
  ngAfterViewInit(): void {
    this.setupSignaturePad();
  }

  /**
   * Limpieza al destruir el componente
   */
  ngOnDestroy(): void {
    this.cleanupEventListeners();
  }
  //#endregion

  //#region Métodos de Configuración del Signature Pad
  /**
   * Configura el pad de firma con las opciones adecuadas
   */
  setupSignaturePad(): void {
    const canvas = this.signaturePadElement.nativeElement;
    this.configureCanvasSize(canvas);
    this.initializeSignaturePad(canvas);
    this.setupResizeListener();
  }

  /**
   * Configura el tamaño del canvas considerando la densidad de píxeles
   */
  private configureCanvasSize(canvas: HTMLCanvasElement): void {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
  }

  /**
   * Inicializa la instancia de SignaturePad con la configuración adecuada
   */
  private initializeSignaturePad(canvas: HTMLCanvasElement): void {
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 1,
      maxWidth: 3,
      throttle: 16
    });
  }

  /**
   * Configura el listener para redimensionamiento de ventana
   */
  private setupResizeListener(): void {
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  /**
   * Limpia los event listeners al destruir el componente
   */
  private cleanupEventListeners(): void {
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }

  /**
   * Redimensiona el canvas manteniendo la firma actual
   */
  resizeCanvas(): void {
    const canvas = this.signaturePadElement.nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    // Guardar la firma actual
    const data = this.signaturePad.toData();

    // Reconfigurar tamaño
    this.configureCanvasSize(canvas);

    // Restaurar la firma
    this.signaturePad.fromData(data);
  }
  //#endregion

  //#region Métodos de Manejo de Eventos Táctiles
  /**
   * Maneja el inicio del toque en dispositivos táctiles
   */
  onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.simulateMouseEvent(e, 'mousedown');
  }

  /**
   * Maneja el movimiento del toque en dispositivos táctiles
   */
  onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    this.simulateMouseEvent(e, 'mousemove');
  }

  /**
   * Maneja el fin del toque en dispositivos táctiles
   */
  onTouchEnd(): void {
    this.simulateMouseEvent(null, 'mouseup');
  }

  /**
   * Simula eventos de mouse para dispositivos táctiles
   */
  private simulateMouseEvent(e: TouchEvent | null, eventType: string): void {
    const canvas = this.signaturePadElement.nativeElement;
    
    if (e && eventType !== 'mouseup') {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      
      const mouseEvent = new MouseEvent(eventType, {
        clientX: touch.clientX - rect.left,
        clientY: touch.clientY - rect.top
      });
      canvas.dispatchEvent(mouseEvent);
    } else {
      const mouseEvent = new MouseEvent(eventType);
      canvas.dispatchEvent(mouseEvent);
    }
  }
  //#endregion

  //#region Métodos de Manejo de Eventos de Mouse
  /**
   * Maneja el evento de presionar el mouse
   */
  onMouseDown(e: MouseEvent): void {
    this.isDrawing = true;
    this.simulateCanvasMouseEvent(e, 'mousedown');
  }

  /**
   * Maneja el evento de mover el mouse
   */
  onMouseMove(e: MouseEvent): void {
    if (this.isDrawing) {
      this.simulateCanvasMouseEvent(e, 'mousemove');
    }
  }

  /**
   * Maneja el evento de soltar el mouse
   */
  onMouseUp(): void {
    this.isDrawing = false;
    this.simulateCanvasMouseEvent(null, 'mouseup');
  }

  /**
   * Simula eventos de mouse en el canvas
   */
  private simulateCanvasMouseEvent(e: MouseEvent | null, eventType: string): void {
    const canvas = this.signaturePadElement.nativeElement;
    
    if (e && eventType !== 'mouseup') {
      const rect = canvas.getBoundingClientRect();
      const mouseEvent = new MouseEvent(eventType, {
        clientX: e.clientX - rect.left,
        clientY: e.clientY - rect.top
      });
      canvas.dispatchEvent(mouseEvent);
    } else {
      const mouseEvent = new MouseEvent(eventType);
      canvas.dispatchEvent(mouseEvent);
    }
  }
  //#endregion

  //#region Métodos de Gestión de Firmas
  /**
   * Abre el modal para la firma del paciente
   */
  toggleFirmaPaciente(): void {
    this.currentSignatureType = 'paciente';
    this.showFirmaPaciente = true;
    this.showFirmaProfesional = false;
    this.reinitializeSignaturePad();
  }

  /**
   * Abre el modal para la firma del profesional
   */
  toggleFirmaProfesional(): void {
    this.currentSignatureType = 'profesional';
    this.showFirmaProfesional = true;
    this.showFirmaPaciente = false;
    this.reinitializeSignaturePad();
  }

  /**
   * Reinicializa el pad de firma después de un cambio de modal
   */
  private reinitializeSignaturePad(): void {
    setTimeout(() => {
      this.clearSignaturePad();
      this.setupSignaturePad();
    }, 0);
  }

  /**
   * Limpia el pad de firma actual
   */
  clearSignaturePad(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  /**
   * Cierra el modal de firma actual
   */
  closeModal(): void {
    this.showFirmaPaciente = false;
    this.showFirmaProfesional = false;
    this.clearSignaturePad();
  }

  /**
   * Limpia la firma actual y resetea el campo correspondiente
   */
  limpiarFirma(): void {
    this.clearSignaturePad();
    const controlName = this.currentSignatureType === 'paciente' ? 'firmaPaciente' : 'firmaProfesional';
    this.consentimientoForm.get(controlName)?.setValue('');
  }

  /**
   * Confirma la firma actual y la guarda en el formulario
   */
  confirmarFirma(): void {
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      const firma = this.signaturePad.toDataURL('image/png');
      const fecha = new Date().toISOString();

      if (this.currentSignatureType === 'paciente') {
        this.consentimientoForm.patchValue({
          firmaPaciente: firma,
          fechaPaciente: fecha
        });
      } else {
        this.consentimientoForm.patchValue({
          firmaProfesional: firma,
          fechaProfesional: fecha
        });
      }

      this.closeModal();
    }
  }
  //#endregion

  //#region Métodos de Gestión del Formulario
  /**
   * Maneja el envío del formulario
   */
  onSubmit(): void {
    if (this.consentimientoForm.valid) {
      this.submitConsentimiento.emit(this.consentimientoForm.value);
    } else {
      this.markAllFieldsAsTouched();
    }
  }

  /**
   * Marca todos los campos como touched para mostrar errores de validación
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.consentimientoForm.controls).forEach(key => {
      this.consentimientoForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Maneja la cancelación del proceso
   */
  onCancel(): void {
    this.cancel.emit();
  }
  //#endregion

  //#region Métodos de Generación de PDF
  /**
   * Genera y descarga el PDF del consentimiento
   */
  async generatePDF(): Promise<void> {
    if (!this.pdfMakeLoaded) {
      await this.loadPdfMake();
    }

    if (this.consentimientoForm.valid) {
      const fechaActual = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
      const nombreArchivo = `Consentimiento_Informado_${fechaActual}.pdf`;

      const docDefinition = this.getDocDefinition();
      pdfMake.createPdf(docDefinition).download(nombreArchivo);
    } else {
      console.warn('El formulario no es válido. Complete todos los campos requeridos.');
    }
  }

  /**
   * Genera la definición del documento PDF
   */
  private getDocDefinition(): any {
    const formValue = this.consentimientoForm.value;

    return {
      content: this.getPdfContent(formValue),
      styles: this.getPdfStyles(),
      defaultStyle: {
        fontSize: 12
      }
    };
  }

  /**
   * Genera el contenido del PDF
   */
  private getPdfContent(formValue: any): any[] {
    return [
      this.getHeaderContent(),
      this.getContactInfoContent(),
      this.getPurposeContent(),
      this.getRightsContent(),
      this.getConsentDeclarationContent(),
      this.getPatientDataContent(formValue),
      this.getProfessionalDataContent(formValue),
      this.getNoteContent()
    ];
  }

  /**
   * Genera el contenido del encabezado del PDF
   */
  private getHeaderContent(): any {
    return [
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
      }
    ];
  }

  /**
   * Genera el contenido de información de contacto
   */
  private getContactInfoContent(): any {
    return [
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
      }
    ];
  }

  /**
   * Genera el contenido sobre la finalidad del tratamiento
   */
  private getPurposeContent(): any {
    return [
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
      }
    ];
  }

  /**
   * Genera el contenido sobre los derechos del titular
   */
  private getRightsContent(): any {
    return [
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
      }
    ];
  }

  /**
   * Genera el contenido de la declaración de consentimiento
   */
  private getConsentDeclarationContent(): any {
    return [
      {
        text: '3. Declaración de consentimiento',
        style: 'sectionHeader'
      },
      {
        text: 'Declaro que he leído y comprendido la información anterior, y que otorgo de manera libre, expresa, voluntaria e informada mi autorización para que mis datos personales y clínicos sean recolectados, almacenados y tratados con las finalidades aquí descritas.',
        margin: [0, 0, 0, 20]
      }
    ];
  }

  /**
   * Genera el contenido de los datos del paciente
   */
  private getPatientDataContent(formValue: any): any {
    return [
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
      }
    ];
  }

  /**
   * Genera el contenido de los datos del profesional
   */
  private getProfessionalDataContent(formValue: any): any {
    return [
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
      }
    ];
  }

  /**
   * Genera el contenido de la nota final
   */
  private getNoteContent(): any {
    return {
      text: '📌 Nota: Este documento debe almacenarse junto con el registro del paciente la primera vez',
      style: 'note',
      margin: [0, 20, 0, 0]
    };
  }

  /**
   * Define los estilos del PDF
   */
  private getPdfStyles(): any {
    return {
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
    };
  }
  //#endregion

  //#region Métodos de Utilidad
  /**
   * Verifica si el formulario es válido
   */
  get isFormValid(): boolean {
    return this.consentimientoForm.valid;
  }

  /**
   * Verifica si la firma del paciente está presente
   */
  get hasPatientSignature(): boolean {
    return !!this.consentimientoForm.get('firmaPaciente')?.value;
  }

  /**
   * Verifica si la firma del profesional está presente
   */
  get hasProfessionalSignature(): boolean {
    return !!this.consentimientoForm.get('firmaProfesional')?.value;
  }

  /**
   * Verifica si el pad de firma actual está vacío
   */
  get isSignaturePadEmpty(): boolean {
    return this.signaturePad ? this.signaturePad.isEmpty() : true;
  }
  //#endregion
}