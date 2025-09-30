// contacto-section.component.ts
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import { jsPDF } from 'jspdf';
import { MatDialog } from '@angular/material/dialog';
import { TerminosModalComponent } from './modal/terminos-modal.component';

/**
 * Componente para la sección de contacto y gestión de solicitudes del sistema RPE.
 * 
 * Este componente maneja múltiples formularios para:
 * - Registro de usuarios
 * - Registro de capas de investigación
 * - Registro de variables
 * - Cambio de contraseñas
 * 
 * Genera PDFs y envía solicitudes por correo electrónico usando EmailJS.
 * 
 * @Component Decorador que define el componente Angular
 */
@Component({
  selector: 'app-contacto-section',
  templateUrl: './contacto-section.component.html',
  styleUrls: ['./contacto-section.component.css']
})
export class ContactoSectionComponent implements OnInit {
  // Formularios reactivos
  registrationForm: FormGroup = this.fb.group({});
  researchLayerForm: FormGroup = this.fb.group({});
  variableForm: FormGroup = this.fb.group({});
  passwordChangeForm: FormGroup = this.fb.group({});

  // Estados de UI
  isSending = false;
  showSuccessMessage = false;
  showLayerSuccessMessage = false;
  showVariableSuccessMessage = false;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showPasswordChangeSuccess = false;

  // Datos y sugerencias
  sugerenciasUsername: string[] = [];
  capas: any[] = [];
  capasInvestigacion: any[] = [];

  // Tipos de datos para variables
  tipos = [
    { valor: 'Entero', descripcion: 'Ej: 1, 2, 3' },
    { valor: 'Real', descripcion: 'Ej: 1.5, 2.75, 3.14' },
    { valor: 'Cadena', descripcion: 'Ej: texto como "Juan", "Azul"' },
    { valor: 'Fecha', descripcion: 'Ej: 2023-04-01' },
    { valor: 'Lógico', descripcion: 'Ej: Verdadero o Falso' }
  ];

  /**
   * Constructor del componente
   * @param cdRef Servicio para detección de cambios
   * @param dialog Servicio para diálogos modales de Angular Material
   * @param fb Servicio para construcción de formularios reactivos
   * @param modalService Servicio para modales de ng-bootstrap
   */
  constructor(
    private cdRef: ChangeDetectorRef,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) { }

  /**
   * Inicialización del componente
   * Configura formularios e inicializa EmailJS
   */
  ngOnInit(): void {
    this.initializeForms();
    emailjs.init('xKoiAF8rBlTus7c0oD');
  }

  // ============================ INICIALIZACIÓN DE FORMULARIOS ============================

  /**
   * Inicializa todos los formularios del componente con sus validaciones
   */
  private initializeForms(): void {
    this.initializeRegistrationForm();
    this.initializeResearchLayerForm();
    this.initializeVariableForm();
    this.initializePasswordChangeForm();
    this.setupUsernameSuggestions();
  }

  /**
   * Inicializa el formulario de registro de usuarios
   */
  private initializeRegistrationForm(): void {
    this.registrationForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      fechaNacimiento: ['', [Validators.required, this.fechaNoFuturaValidator]],
      rol: ['', [Validators.required]],
      capaInvestigacion: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      responsable: ['', [Validators.required]],
      username: [''],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  /**
   * Inicializa el formulario de registro de capas de investigación
   */
  private initializeResearchLayerForm(): void {
    this.researchLayerForm = this.fb.group({
      layerName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      bossName: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z ]*$')]],
      identificationNumber: ['', [Validators.required, Validators.minLength(5), Validators.pattern('^[0-9]*$')]],
      bossEmail: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Inicializa el formulario de registro de variables
   */
  private initializeVariableForm(): void {
    this.variableForm = this.fb.group({
      researchLayerId: ['', [Validators.required]],
      variableName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      type: ['', [Validators.required]],
      hasOptions: [false],
      isEnabled: [true],
      options: this.fb.array([])
    });
  }

  /**
   * Inicializa el formulario de cambio de contraseña
   */
  private initializePasswordChangeForm(): void {
    this.passwordChangeForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      identificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      role: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$')
      ]],
      confirmPassword: ['', [Validators.required]],
      reason: ['', [Validators.required]],
      otherReason: ['']
    }, { validator: this.passwordMatchValidator });
  }

  /**
   * Configura observables para generar sugerencias de username
   */
  private setupUsernameSuggestions(): void {
    this.registrationForm.get('nombre')?.valueChanges.subscribe(() => this.generateUsernameSuggestions());
    this.registrationForm.get('apellido')?.valueChanges.subscribe(() => this.generateUsernameSuggestions());
  }

  // ============================ PROPIEDADES DE FORMULARIO ============================

  /**
   * Obtiene el FormArray de opciones para variables
   * @returns FormArray con las opciones de la variable
   */
  get options(): FormArray {
    return this.variableForm.get('options') as FormArray;
  }

  // ============================ MÉTODOS DE USUARIO ============================

  /**
   * Genera sugerencias de username basadas en nombre y apellido
   */
  generateUsernameSuggestions(): void {
    const nombre = this.registrationForm.get('nombre')?.value || '';
    const apellido = this.registrationForm.get('apellido')?.value || '';

    if (nombre && apellido) {
      this.sugerenciasUsername = [
        `${nombre.toLowerCase()}.${apellido.toLowerCase()}`,
        `${nombre.charAt(0).toLowerCase()}${apellido.toLowerCase()}`,
        `${nombre.toLowerCase()}${apellido.charAt(0).toLowerCase()}`,
        `${nombre.toLowerCase()}_${apellido.toLowerCase()}`
      ];
    } else if (nombre) {
      this.sugerenciasUsername = [
        `${nombre.toLowerCase()}`,
        `user_${nombre.toLowerCase()}`
      ];
    } else {
      this.sugerenciasUsername = [];
    }
  }

  /**
   * Alterna la visibilidad de la contraseña en el formulario de registro
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // ============================ MÉTODOS DE VARIABLES ============================

  /**
   * Agrega una nueva opción al FormArray de opciones
   */
  agregarOpcion(): void {
    this.options.push(this.fb.control('', [Validators.required, this.duplicateOptionValidator()]));
  }

  /**
   * Elimina una opción del FormArray por índice
   * @param index Índice de la opción a eliminar
   */
  eliminarOpcion(index: number): void {
    this.options.removeAt(index);
  }

  /**
   * Validador para evitar opciones duplicadas
   * @returns Función validadora que verifica duplicados
   */
  duplicateOptionValidator(): any {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;

      const duplicate = this.options.controls
        .filter(opt => opt !== control)
        .some(opt => opt.value.toLowerCase() === control.value.toLowerCase());

      return duplicate ? { duplicado: true } : null;
    };
  }

  /**
   * Maneja el cambio en el campo 'hasOptions'
   * Agrega o limpia las opciones según corresponda
   */
  onHasOptionsChange(): void {
    if (this.variableForm.get('hasOptions')?.value) {
      this.agregarOpcion();
    } else {
      this.options.clear();
    }
  }

  /**
   * Obtiene mensajes de error para mostrar en tooltips
   * @returns Mensaje de error descriptivo
   */
  getErroresTooltip(): string {
    if (this.variableForm.invalid) {
      return 'Por favor complete todos los campos requeridos';
    }
    if (this.variableForm.get('hasOptions')?.value && this.options.length === 0) {
      return 'Debe agregar al menos una opción';
    }
    return '';
  }

  /**
   * Cancela el formulario de variables y resetea el estado
   */
  onCancel(): void {
    this.closeModal('variableModal');
    this.variableForm.reset({
      hasOptions: false,
      isEnabled: true,
      options: []
    });
    this.options.clear();
  }

  // ============================ VALIDADORES ============================

  /**
   * Validador personalizado para fechas que no sean futuras
   * @param control Control del formulario a validar
   * @returns Objeto de error o null si es válido
   */
  fechaNoFuturaValidator(control: AbstractControl): { [key: string]: any } | null {
    const inputDate = new Date(control.value);
    return inputDate > new Date() ? { futureDate: true } : null;
  }

  /**
   * Validador para coincidencia de contraseñas
   * @param formGroup Grupo de formulario que contiene los campos de contraseña
   * @returns Objeto de error o null si coinciden
   */
  passwordMatchValidator(formGroup: FormGroup): { [key: string]: any } | null {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // ============================ GESTIÓN DE MODALES ============================

  /**
   * Abre un modal por su ID
   * @param modalId ID del elemento modal a abrir
   */
  openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Cierra un modal por su ID
   * @param modalId ID del elemento modal a cerrar
   */
  closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
    this.cdRef.detectChanges();
  }

  /**
   * Abre el modal de registro de usuario
   */
  openRegistrationModal(): void {
    this.showSuccessMessage = false;
    this.isSending = false;
    this.openModal('registrationModal');
  }

  /**
   * Abre el modal de registro de capa de investigación
   */
  openLayerRegistrationModal(): void {
    this.showLayerSuccessMessage = false;
    this.isSending = false;
    this.openModal('researchLayerModal');
  }

  /**
   * Abre el modal de registro de variable
   */
  openVariableRegistrationModal(): void {
    this.showVariableSuccessMessage = false;
    this.isSending = false;
    this.openModal('variableModal');
  }

  /**
   * Abre el modal de cambio de contraseña
   */
  openPasswordChangeModal(): void {
    this.showPasswordChangeSuccess = false;
    this.isSending = false;
    this.passwordChangeForm.reset();
    this.openModal('passwordChangeModal');
  }

  /**
   * Abre el modal de términos y condiciones
   */
  abrirTerminos(): void {
    this.dialog.open(TerminosModalComponent, {
      width: '80vw',
      maxWidth: '900px',
      height: '80vh',
      panelClass: 'terminos-dialog',
      autoFocus: false
    });
  }

  // ============================ ENVÍO DE FORMULARIOS ============================

  /**
   * Envía el formulario de registro de usuario
   */
  async submitRegistration(): Promise<void> {
    if (this.registrationForm.valid) {
      this.isSending = true;
      try {
        const pdfDoc = this.generateRegistrationPDF();
        const pdfBlob = pdfDoc.output('blob');
        await this.sendRegistrationEmail(pdfBlob);
        this.showSuccessMessage = true;
        this.registrationForm.reset();
      } catch (error) {
        alert('Error al enviar la solicitud de registro. Intenta de nuevo.');
      } finally {
        this.isSending = false;
        this.cdRef.detectChanges();
      }
    }
  }

  /**
   * Envía el formulario de registro de capa de investigación
   */
  async submitResearchLayer(): Promise<void> {
    if (this.researchLayerForm.valid) {
      this.isSending = true;
      try {
        const pdfDoc = this.generateResearchLayerPDF();
        const pdfBlob = pdfDoc.output('blob');
        await this.sendResearchLayerEmail(pdfBlob);
        this.showLayerSuccessMessage = true;
        this.researchLayerForm.reset();
      } catch (error) {
        alert('Error al enviar la solicitud de capa. Intenta de nuevo.');
      } finally {
        this.isSending = false;
        this.cdRef.detectChanges();
      }
    }
  }

  /**
   * Envía el formulario de registro de variable
   */
  async submitVariable(): Promise<void> {
    if (this.variableForm.valid) {
      this.isSending = true;
      try {
        const pdfDoc = this.generateVariablePDF();
        const pdfBlob = pdfDoc.output('blob');
        await this.sendVariableEmail(pdfBlob);
        this.showVariableSuccessMessage = true;
        this.variableForm.reset();
      } catch (error) {
        alert('Error al enviar la solicitud de variable. Intenta de nuevo.');
      } finally {
        this.isSending = false;
        this.cdRef.detectChanges();
      }
    }
  }

  /**
   * Envía el formulario de cambio de contraseña
   */
  async submitPasswordChange(): Promise<void> {
    if (this.passwordChangeForm.valid) {
      this.isSending = true;
      try {
        const pdfDoc = this.generatePasswordChangePDF();
        const pdfBlob = pdfDoc.output('blob');
        await this.sendPasswordChangeEmail(pdfBlob);
        this.showPasswordChangeSuccess = true;
      } catch (error) {
        alert('Error al enviar la solicitud de cambio de contraseña. Intenta de nuevo.');
      } finally {
        this.isSending = false;
        this.cdRef.detectChanges();
      }
    } else {
      this.markFormGroupTouched(this.passwordChangeForm);
    }
  }

  // ============================ GENERACIÓN DE PDFs ============================

  /**
   * Genera PDF para solicitud de registro de usuario
   * @returns Documento PDF con la información del registro
   */
  generateRegistrationPDF(): jsPDF {
    const formData = this.registrationForm.value;
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(40, 53, 147);
    doc.setFontSize(16);
    doc.text('REGISTRO POBLACIONAL DE EPILEPSIA (RPE)', 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('SOLICITUD DE REGISTRO DE USUARIO', 105, 25, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 105, 32, { align: 'center' });
    
    doc.setDrawColor(40, 53, 147);
    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    let yPosition = 45;
    
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN DEL SOLICITANTE', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition = this.addFormField(doc, '• Nombre completo:', `${formData.nombre} ${formData.apellido}`, yPosition + 10);
    yPosition = this.addFormField(doc, '• Tipo de documento:', this.getDocumentTypeName(formData.tipoDocumento), yPosition);
    yPosition = this.addFormField(doc, '• Número de documento:', formData.numeroDocumento, yPosition);
    yPosition = this.addFormField(doc, '• Fecha de nacimiento:', 
      formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toLocaleDateString() : '', yPosition);
    yPosition = this.addFormField(doc, '• Correo electrónico:', formData.email, yPosition);
    
    yPosition = this.addSectionTitle(doc, '2. DETALLES DEL REGISTRO', yPosition + 3);
    yPosition = this.addFormField(doc, '• Rol:', this.getRoleName(formData.rol), yPosition);
    yPosition = this.addFormField(doc, '• Capa de investigación:', formData.capaInvestigacion, yPosition);
    yPosition = this.addFormField(doc, '• Términos y condiciones aceptados:', formData.acceptTerms ? 'Sí' : 'No', yPosition);
    
    yPosition = this.addSectionTitle(doc, '3. RESPONSABLE DEL REGISTRO', yPosition + 3);
    yPosition = this.addFormField(doc, '• Nombre del responsable:', formData.responsable, yPosition);
    
    this.addFooterNotes(doc, yPosition + 7);
    
    return doc;
  }

  /**
   * Genera PDF para solicitud de registro de capa de investigación
   * @returns Documento PDF con la información de la capa
   */
  generateResearchLayerPDF(): jsPDF {
    const formData = this.researchLayerForm.value;
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(40, 53, 147);
    doc.setFontSize(16);
    doc.text('REGISTRO POBLACIONAL DE EPILEPSIA (RPE)', 105, 15, { align: 'center' });
    doc.text('SOLICITUD DE REGISTRO DE CAPA DE INVESTIGACIÓN', 105, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 105, 32, { align: 'center' });
    doc.setDrawColor(40, 53, 147);
    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    let yPosition = 45;
    
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN DE LA CAPA DE INVESTIGACIÓN', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition = this.addFormField(doc, '• Nombre de la capa:', formData.layerName, yPosition + 10);
    
    const descriptionLines = doc.splitTextToSize(`• Descripción: ${formData.description}`, 170);
    doc.text(descriptionLines, 20, yPosition);
    yPosition += descriptionLines.length * 7 + 5;
    
    yPosition = this.addSectionTitle(doc, '2. RESPONSABLE DE LA CAPA', yPosition);
    yPosition = this.addFormField(doc, '• Nombre del responsable:', formData.bossName, yPosition);
    yPosition = this.addFormField(doc, '• Número de identificación:', formData.identificationNumber, yPosition);
    yPosition = this.addFormField(doc, '• Correo electrónico:', formData.bossEmail, yPosition);
    
    this.addFooterNotes(doc, yPosition + 7);
    
    return doc;
  }

  /**
   * Genera PDF para solicitud de registro de variable
   * @returns Documento PDF con la información de la variable
   */
  generateVariablePDF(): jsPDF {
    const formData = this.variableForm.value;
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(40, 53, 147);
    doc.setFontSize(16);
    doc.text('REGISTRO POBLACIONAL DE EPILEPSIA (RPE)', 105, 15, { align: 'center' });
    doc.text('SOLICITUD DE REGISTRO DE VARIABLE', 105, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 105, 32, { align: 'center' });
    doc.setDrawColor(40, 53, 147);
    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    let yPosition = 45;
    
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN DE LA VARIABLE', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition = this.addFormField(doc, '• ID de la capa de investigación:', formData.researchLayerId, yPosition + 10);
    yPosition = this.addFormField(doc, '• Nombre de la variable:', formData.variableName, yPosition);
    
    const descriptionLines = doc.splitTextToSize(`• Descripción: ${formData.description}`, 170);
    doc.text(descriptionLines, 20, yPosition);
    yPosition += descriptionLines.length * 7 + 5;
    
    yPosition = this.addFormField(doc, '• Tipo:', formData.type, yPosition);
    yPosition = this.addFormField(doc, '• Tiene opciones:', formData.hasOptions ? 'Sí' : 'No', yPosition);
    yPosition = this.addFormField(doc, '• Opciones:', formData.options || 'N/A', yPosition);
    yPosition = this.addFormField(doc, '• Habilitada:', formData.isEnabled ? 'Sí' : 'No', yPosition);
    
    this.addFooterNotes(doc, yPosition + 7);
    
    return doc;
  }

  /**
   * Genera PDF para solicitud de cambio de contraseña
   * @returns Documento PDF con la información del cambio
   */
  generatePasswordChangePDF(): jsPDF {
    const formData = this.passwordChangeForm.value;
    const doc = new jsPDF();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(40, 53, 147);
    doc.setFontSize(16);
    doc.text('REGISTRO POBLACIONAL DE EPILEPSIA (RPE)', 105, 15, { align: 'center' });
    doc.text('SOLICITUD DE CAMBIO DE CONTRASEÑA', 105, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 105, 32, { align: 'center' });

    doc.setDrawColor(40, 53, 147);
    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN DEL SOLICITANTE', 15, 45);
    doc.setFont('helvetica', 'normal');

    let yPosition = 55;
    yPosition = this.addFormField(doc, '• Correo electrónico:', formData.email, yPosition);
    yPosition = this.addFormField(doc, '• Número de identificación:', formData.identificationNumber, yPosition);
    yPosition = this.addFormField(doc, '• Rol en el sistema:', this.getRoleName(formData.role), yPosition);

    doc.setFont('helvetica', 'bold');
    doc.text('2. DETALLES DEL CAMBIO', 15, yPosition + 3);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;

    yPosition = this.addFormField(doc, '• Motivo del cambio:', this.getReasonName(formData.reason), yPosition);

    if (formData.reason === 'otro' && formData.otherReason) {
      const otherReasonLines = doc.splitTextToSize(`• Especificación: ${formData.otherReason}`, 170);
      doc.text(otherReasonLines, 20, yPosition);
      yPosition += otherReasonLines.length * 7;
    }

    this.addFooterNotes(doc, yPosition + 12);

    return doc;
  }

  // ============================ MÉTODOS AUXILIARES PDF ============================

  /**
   * Agrega un campo de formulario al PDF
   * @param doc Documento PDF
   * @param label Etiqueta del campo
   * @param value Valor del campo
   * @param yPosition Posición Y actual
   * @returns Nueva posición Y
   */
  private addFormField(doc: jsPDF, label: string, value: string, yPosition: number): number {
    doc.text(`${label} ${value}`, 20, yPosition);
    return yPosition + 7;
  }

  /**
   * Agrega un título de sección al PDF
   * @param doc Documento PDF
   * @param title Título de la sección
   * @param yPosition Posición Y actual
   * @returns Nueva posición Y
   */
  private addSectionTitle(doc: jsPDF, title: string, yPosition: number): number {
    doc.setFont('helvetica', 'bold');
    doc.text(title, 15, yPosition);
    doc.setFont('helvetica', 'normal');
    return yPosition + 10;
  }

  /**
   * Agrega notas al pie del documento PDF
   * @param doc Documento PDF
   * @param yPosition Posición Y actual
   */
  private addFooterNotes(doc: jsPDF, yPosition: number): void {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Nota: Esta solicitud será revisada por el equipo administrativo del RPE.', 15, yPosition);
    yPosition += 5;
    doc.text('Se notificará al correo electrónico proporcionado una vez procesada.', 15, yPosition);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© Registro Poblacional de Epilepsia - Universidad del Valle', 105, 290, { align: 'center' });
  }

  // ============================ ENVÍO DE CORREOS ============================

  /**
   * Convierte un Blob a base64
   * @param blob Blob a convertir
   * @returns Promise con el string base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Envía correo de registro de usuario
   * @param pdfBlob PDF adjunto
   * @returns Respuesta de EmailJS
   */
  async sendRegistrationEmail(pdfBlob: Blob): Promise<EmailJSResponseStatus> {
    const formData = this.registrationForm.value;
    const pdfBase64 = await this.blobToBase64(pdfBlob);
    const templateParams = {
      to_name: 'Administrador RPE',
      from_name: `${formData.nombre} ${formData.apellido}`,
      from_email: formData.email,
      document_type: this.getDocumentTypeName(formData.tipoDocumento),
      document_number: formData.numeroDocumento,
      birth_date: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toLocaleDateString() : '',
      role: this.getRoleName(formData.rol),
      research_layer: formData.capaInvestigacion,
      responsible: formData.responsable,
      accept_terms: formData.acceptTerms ? 'Sí' : 'No',
      attachment: pdfBase64,
      message: 'Nueva solicitud de registro de usuario'
    };

    return emailjs.send('service_km76q7v', 'template_fwneuqt', templateParams);
  }

  /**
   * Envía correo de registro de capa de investigación
   * @param pdfBlob PDF adjunto
   * @returns Respuesta de EmailJS
   */
  async sendResearchLayerEmail(pdfBlob: Blob): Promise<EmailJSResponseStatus> {
    const formData = this.researchLayerForm.value;
    const pdfBase64 = await this.blobToBase64(pdfBlob);
    const templateParams = {
      to_name: 'Administrador RPE',
      from_name: formData.bossName,
      from_email: formData.bossEmail,
      layer_name: formData.layerName,
      description: formData.description,
      boss_id: formData.identificationNumber,
      attachment: pdfBase64,
      message: 'Nueva solicitud de registro de capa de investigación'
    };

    return emailjs.send('service_km76q7v', 'template_fwneuqt', templateParams);
  }

  /**
   * Envía correo de registro de variable
   * @param pdfBlob PDF adjunto
   * @returns Respuesta de EmailJS
   */
  async sendVariableEmail(pdfBlob: Blob): Promise<EmailJSResponseStatus> {
    const formData = this.variableForm.value;
    const pdfBase64 = await this.blobToBase64(pdfBlob);
    const templateParams = {
      to_name: 'Administrador RPE',
      layer_id: formData.researchLayerId,
      variable_name: formData.variableName,
      description: formData.description,
      type: formData.type,
      has_options: formData.hasOptions ? 'Sí' : 'No',
      options: formData.options || 'N/A',
      is_enabled: formData.isEnabled ? 'Sí' : 'No',
      attachment: pdfBase64,
      message: 'Nueva solicitud de registro de variable'
    };

    return emailjs.send('service_km76q7v', 'template_fwneuqt', templateParams);
  }

  /**
   * Envía correo de cambio de contraseña
   * @param pdfBlob PDF adjunto
   * @returns Respuesta de EmailJS
   */
  async sendPasswordChangeEmail(pdfBlob: Blob): Promise<EmailJSResponseStatus> {
    const formData = this.passwordChangeForm.value;
    const pdfBase64 = await this.blobToBase64(pdfBlob);

    const templateParams = {
      to_name: 'Administrador RPE',
      from_email: formData.email,
      identification_number: formData.identificationNumber,
      role: this.getRoleName(formData.role),
      reason: this.getReasonName(formData.reason),
      other_reason: formData.reason === 'otro' ? formData.otherReason : 'N/A',
      attachment: pdfBase64,
      message: 'Solicitud de cambio de contraseña'
    };

    return emailjs.send('service_km76q7v', 'template_fwneuqt', templateParams);
  }

  // ============================ MÉTODOS DE VISIBILIDAD ============================

  /**
   * Alterna la visibilidad de la nueva contraseña
   */
  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  /**
   * Alterna la visibilidad de la confirmación de contraseña
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ============================ MÉTODOS DE UTILIDAD ============================

  /**
   * Obtiene el nombre completo del tipo de documento
   * @param type Código del tipo de documento
   * @returns Nombre completo del tipo
   */
  getDocumentTypeName(type: string): string {
    const types: { [key: string]: string } = {
      'CC': 'Cédula de Ciudadanía',
      'CE': 'Cédula de Extranjería',
      'PA': 'Pasaporte',
      'TI': 'Tarjeta de Identidad'
    };
    return types[type] || type;
  }

  /**
   * Obtiene el nombre completo del rol
   * @param role Código del rol
   * @returns Nombre completo del rol
   */
  getRoleName(role: string): string {
    const roles: { [key: string]: string } = {
      'investigador': 'Investigador',
      'doctor': 'Doctor',
      'administrador': 'Administrador'
    };
    return roles[role] || role;
  }

  /**
   * Obtiene el nombre completo del motivo de cambio de contraseña
   * @param reason Código del motivo
   * @returns Nombre completo del motivo
   */
  getReasonName(reason: string): string {
    const reasons: { [key: string]: string } = {
      'olvido': 'Olvidé mi contraseña',
      'seguridad': 'Motivos de seguridad',
      'primera_vez': 'Primer acceso al sistema',
      'otro': 'Otro motivo'
    };
    return reasons[reason] || reason;
  }

  /**
   * Marca todos los campos de un FormGroup como touched
   * @param formGroup Grupo de formulario a marcar
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}