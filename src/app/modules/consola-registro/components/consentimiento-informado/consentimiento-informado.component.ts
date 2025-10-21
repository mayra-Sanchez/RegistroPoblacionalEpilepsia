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
  @ViewChild('signatureModal', { static: false }) signatureModal!: ElementRef;
  //#endregion

  //#region Propiedades del Componente
  /** Instancia del SignaturePad para manejar firmas */
  signaturePad!: SignaturePad;

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
   * Carga la librería pdfMake de forma asíncrona con mejor manejo de errores
   */
  async loadPdfMake(): Promise<void> {
    if (this.pdfMakeLoaded) return;

    try {
      console.log('Iniciando carga de pdfMake...');

      const pdfMakeModule = await import('pdfmake/build/pdfmake');
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

      if (pdfMakeModule && pdfMakeModule.default) {
        pdfMake = pdfMakeModule.default;

        if (pdfFontsModule && pdfFontsModule.default) {
          pdfMake.vfs = pdfFontsModule.default;
          // Configurar fuentes
          pdfMake.fonts = {
            Roboto: {
              normal: 'Roboto-Regular.ttf',
              bold: 'Roboto-Medium.ttf',
              italics: 'Roboto-Italic.ttf',
              bolditalics: 'Roboto-MediumItalic.ttf'
            }
          };
          this.pdfMakeLoaded = true;
          console.log('pdfMake cargado exitosamente');
        } else {
          throw new Error('No se pudieron cargar las fuentes PDF');
        }
      } else {
        throw new Error('No se pudo cargar pdfMake');
      }
    } catch (error) {
      console.error('Error crítico al cargar pdfMake:', error);
      this.pdfMakeLoaded = false;
      throw error;
    }
  }
  //#endregion

  //#region Lifecycle Hooks
  /**
   * Inicialización después de que la vista esté disponible
   */
  ngAfterViewInit(): void {
    // No inicializamos el signature pad aquí porque el modal no está en el DOM
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
    if (!this.signaturePadElement?.nativeElement) {
      console.warn('Signature pad element not available');
      return;
    }

    const canvas = this.signaturePadElement.nativeElement;
    this.configureCanvasSize(canvas);
    this.initializeSignaturePad(canvas);
    this.setupResizeListener();
  }

  /**
   * Configura el tamaño del canvas considerando la densidad de píxeles
   */
  private configureCanvasSize(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
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
    if (!this.signaturePadElement?.nativeElement || !this.signaturePad) {
      return;
    }

    const canvas = this.signaturePadElement.nativeElement;
    const data = this.signaturePad.toData();
    
    this.configureCanvasSize(canvas);
    this.signaturePad.fromData(data);
  }
  //#endregion

  //#region Métodos de Gestión de Firmas
  /**
   * Abre el modal para la firma del paciente
   */
  openFirmaPaciente(event: MouseEvent): void {
    this.currentSignatureType = 'paciente';
    this.showFirmaPaciente = true;
    this.showFirmaProfesional = false;
    // Esperar a que el modal se renderice y luego inicializar el pad
    setTimeout(() => {
      this.setupSignaturePad();
    }, 0);
  }

  /**
   * Abre el modal para la firma del profesional
   */
  openFirmaProfesional(event: MouseEvent): void {
    this.currentSignatureType = 'profesional';
    this.showFirmaProfesional = true;
    this.showFirmaPaciente = false;
    // Esperar a que el modal se renderice y luego inicializar el pad
    setTimeout(() => {
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
    try {
      // Validar que el formulario esté completo
      if (!this.consentimientoForm.valid) {
        console.warn('El formulario no es válido. Complete todos los campos requeridos.');
        this.markAllFieldsAsTouched();

        // Mostrar alerta al usuario
        alert('Por favor, complete todos los campos requeridos antes de generar el PDF.');
        return;
      }

      // Asegurar que pdfMake esté cargado
      if (!this.pdfMakeLoaded) {
        console.log('Cargando pdfMake...');
        await this.loadPdfMake();

        if (!this.pdfMakeLoaded) {
          throw new Error('No se pudo cargar la librería PDF');
        }
      }

      const formValue = this.consentimientoForm.value;
      const fechaActual = formatDate(new Date(), 'yyyy-MM-dd', 'en-US');
      const nombreArchivo = `Consentimiento_Informado_${fechaActual}.pdf`;

      console.log('Generando PDF...', formValue);

      const docDefinition = this.getDocDefinition();

      // Verificar que la definición del documento sea válida
      if (!docDefinition) {
        throw new Error('Error en la definición del documento PDF');
      }

      // Generar y descargar PDF
      pdfMake.createPdf(docDefinition).download(nombreArchivo);

      console.log('PDF generado exitosamente');

    } catch (error) {
      console.error('Error al generar el PDF:', error);

      // Mostrar mensaje de error al usuario
      alert('Error al generar el PDF. Por favor, intente nuevamente.');

      // Intentar cargar pdfMake nuevamente en caso de error
      this.pdfMakeLoaded = false;
    }
  }

  /**
   * Genera el contenido del PDF
   */
  private getPdfContent(formValue: any): any[] {
    return [
      this.getPdfTitle(),
      this.getPdfDivider(),
      this.getContactInfoContent(),
      this.getPurposeContent(),
      this.getRightsContent(),
      this.getConsentDeclarationContent(),
      this.getPdfDivider(),
      this.getPatientDataContent(formValue),
      { text: '', pageBreak: 'before' },
      this.getProfessionalDataContent(formValue),
      this.getNoteContent()
    ];
  }

  private getPdfTitle(): any {
    return {
      stack: [
        {
          text: 'CONSENTIMIENTO INFORMADO',
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          text: 'PARA EL TRATAMIENTO DE DATOS PERSONALES',
          style: 'subtitle',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          text: 'Proyecto: Registro de Pacientes con Epilepsia (RPE) – Piloto',
          style: 'project',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        }
      ]
    };
  }

  private getPdfDivider(): any {
    return {
      canvas: [
        {
          type: 'line',
          x1: 0, y1: 5,
          x2: 515, y2: 5,
          lineWidth: 1,
          lineColor: '#cccccc'
        }
      ],
      margin: [0, 10, 0, 10]
    };
  }

  private getPdfHeader(): any {
    return {
      columns: [
        {
          text: 'Universidad del Valle',
          alignment: 'left',
          fontSize: 9,
          color: '#666666',
          margin: [40, 20, 0, 0]
        },
        {
          text: 'Registro de Pacientes con Epilepsia',
          alignment: 'right',
          fontSize: 9,
          color: '#666666',
          margin: [0, 20, 40, 0]
        }
      ]
    };
  }

  private getDocDefinition(): any {
    const formValue = this.consentimientoForm.value;

    // Validar datos requeridos
    if (!formValue.nombrePaciente || !formValue.documentoPaciente) {
      console.error('Faltan datos requeridos para generar el PDF');
      return null;
    }

    return {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: this.getPdfContent(formValue),
      styles: this.getPdfStyles(),
      defaultStyle: {
        font: 'Roboto', // Cambiado de Helvetica a Roboto
        fontSize: 10,
        lineHeight: 1.3
      },
      header: this.getPdfHeader(),
      footer: this.getPdfFooter()
    };
  }

  private getPdfFooter(): any {
    return (currentPage: number, pageCount: number) => {
      return {
        columns: [
          {
            text: `Generado el ${formatDate(new Date(), 'dd/MM/yyyy HH:mm', 'en-US')}`,
            alignment: 'left',
            fontSize: 8,
            color: '#999999',
            margin: [40, 0, 0, 20]
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'right',
            fontSize: 8,
            color: '#999999',
            margin: [0, 0, 40, 20]
          }
        ]
      };
    };
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
        text: 'DATOS DEL PACIENTE O REPRESENTANTE LEGAL',
        style: 'sectionHeader'
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: 'Nombre completo:',
                style: 'signatureLabel'
              },
              {
                text: formValue.nombrePaciente || 'No proporcionado',
                margin: [0, 0, 0, 10]
              },
              {
                text: 'Documento de identidad:',
                style: 'signatureLabel'
              },
              {
                text: formValue.documentoPaciente || 'No proporcionado',
                margin: [0, 0, 0, 10]
              }
            ]
          },
          {
            width: '50%',
            stack: [
              {
                text: 'Firma:',
                style: 'signatureLabel'
              },
              formValue.firmaPaciente ?
                {
                  image: formValue.firmaPaciente,
                  width: 120,
                  height: 60,
                  margin: [0, 0, 0, 5]
                } : {
                  text: 'No firmado',
                  italics: true,
                  color: '#e74c3c'
                },
              {
                text: `Fecha: ${formValue.fechaPaciente ? formatDate(formValue.fechaPaciente, 'dd/MM/yyyy HH:mm', 'en-US') : 'No registrada'}`,
                style: 'signatureDate'
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Genera el contenido de los datos del profesional
   */
  private getProfessionalDataContent(formValue: any): any {
    return [
      {
        text: 'DATOS DEL PROFESIONAL DE SALUD',
        style: 'sectionHeader'
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              {
                text: 'Nombre completo:',
                style: 'signatureLabel'
              },
              {
                text: formValue.nombreProfesional || 'No proporcionado',
                margin: [0, 0, 0, 10]
              },
              {
                text: 'Cargo / Especialidad:',
                style: 'signatureLabel'
              },
              {
                text: formValue.cargoProfesional || 'No proporcionado',
                margin: [0, 0, 0, 10]
              }
            ]
          },
          {
            width: '50%',
            stack: [
              {
                text: 'Firma:',
                style: 'signatureLabel'
              },
              formValue.firmaProfesional ?
                {
                  image: formValue.firmaProfesional,
                  width: 120,
                  height: 60,
                  margin: [0, 0, 0, 5]
                } : {
                  text: 'No firmado',
                  italics: true,
                  color: '#e74c3c'
                },
              {
                text: `Fecha: ${formValue.fechaProfesional ? formatDate(formValue.fechaProfesional, 'dd/MM/yyyy HH:mm', 'en-US') : 'No registrada'}`,
                style: 'signatureDate'
              }
            ]
          }
        ]
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
      title: {
        fontSize: 16,
        bold: true,
        color: '#2c3e50'
      },
      subtitle: {
        fontSize: 14,
        bold: true,
        color: '#2c3e50'
      },
      project: {
        fontSize: 11,
        bold: true,
        color: '#34495e'
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#2c3e50',
        margin: [0, 15, 0, 8],
        background: '#f8f9fa',
        padding: [8, 8, 8, 8],
        borderRadius: 4
      },
      note: {
        fontSize: 9,
        italics: true,
        color: '#7f8c8d',
        background: '#ecf0f1',
        padding: [10, 10, 10, 10],
        borderRadius: 4
      },
      signatureLabel: {
        fontSize: 10,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      signatureDate: {
        fontSize: 9,
        color: '#666666',
        margin: [0, 5, 0, 0]
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

  // Getter para el estilo del modal
  get modalStyle(): any {
    return {
      'position': 'fixed',
      'transform': 'none',
      'z-index': 1000
    };
  }
  //#endregion
}