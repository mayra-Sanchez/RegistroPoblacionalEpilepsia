import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl } from '@angular/forms';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-contacto-section',
  templateUrl: './contacto-section.component.html',
  styleUrls: ['./contacto-section.component.css']
})
export class ContactoSectionComponent implements OnInit {
  registrationForm: FormGroup = this.fb.group({});
  researchLayerForm: FormGroup = this.fb.group({});
  variableForm: FormGroup = this.fb.group({});
  passwordChangeForm: FormGroup = this.fb.group({});
  isSending = false;
  showSuccessMessage = false;
  showLayerSuccessMessage = false;
  showVariableSuccessMessage = false;
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showPasswordChangeSuccess = false;
  sugerenciasUsername: string[] = [];
  capas: any[] = [];
  capasInvestigacion: any[] = [];

  tipos = [
    { valor: 'Entero', descripcion: 'Ej: 1, 2, 3' },
    { valor: 'Real', descripcion: 'Ej: 1.5, 2.75, 3.14' },
    { valor: 'Cadena', descripcion: 'Ej: texto como "Juan", "Azul"' },
    { valor: 'Fecha', descripcion: 'Ej: 2023-04-01' },
    { valor: 'Lógico', descripcion: 'Ej: Verdadero o Falso' }
  ];

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initializeForms();
    emailjs.init('xKoiAF8rBlTus7c0oD');
  }

  private initializeForms(): void {
    // User Registration Form
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
      username: ['']
    });

    // Research Layer Form
    this.researchLayerForm = this.fb.group({
      layerName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      bossName: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-Z ]*$')]],
      identificationNumber: ['', [Validators.required, Validators.minLength(5), Validators.pattern('^[0-9]*$')]],
      bossEmail: ['', [Validators.required, Validators.email]]
    });

    // Variable Form
    this.variableForm = this.fb.group({
      researchLayerId: ['', [Validators.required]],
      variableName: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      type: ['', [Validators.required]],
      hasOptions: [false],
      isEnabled: [true],
      options: this.fb.array([])
    });

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

    // Generate username suggestions when name or lastname changes
    this.registrationForm.get('nombre')?.valueChanges.subscribe(() => this.generateUsernameSuggestions());
    this.registrationForm.get('apellido')?.valueChanges.subscribe(() => this.generateUsernameSuggestions());
  }

  get options(): FormArray {
    return this.variableForm.get('options') as FormArray;
  }

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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  agregarOpcion(): void {
    this.options.push(this.fb.control('', [Validators.required, this.duplicateOptionValidator()]));
  }

  eliminarOpcion(index: number): void {
    this.options.removeAt(index);
  }

  duplicateOptionValidator(): any {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;

      const duplicate = this.options.controls
        .filter(opt => opt !== control)
        .some(opt => opt.value.toLowerCase() === control.value.toLowerCase());

      return duplicate ? { duplicado: true } : null;
    };
  }

  onHasOptionsChange(): void {
    if (this.variableForm.get('hasOptions')?.value) {
      this.agregarOpcion();
    } else {
      this.options.clear();
    }
  }

  getErroresTooltip(): string {
    if (this.variableForm.invalid) {
      return 'Por favor complete todos los campos requeridos';
    }
    if (this.variableForm.get('hasOptions')?.value && this.options.length === 0) {
      return 'Debe agregar al menos una opción';
    }
    return '';
  }

  onCancel(): void {
    this.closeModal('variableModal');
    this.variableForm.reset({
      hasOptions: false,
      isEnabled: true,
      options: []
    });
    this.options.clear();
  }

  fechaNoFuturaValidator(control: AbstractControl): { [key: string]: any } | null {
    const inputDate = new Date(control.value);
    return inputDate > new Date() ? { futureDate: true } : null;
  }

  openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';

    }
    this.cdRef.detectChanges();
  }

  openRegistrationModal(): void {
    this.showSuccessMessage = false;
    this.isSending = false;
    this.openModal('registrationModal');
  }

  openLayerRegistrationModal(): void {
    this.showLayerSuccessMessage = false;
    this.isSending = false;
    this.openModal('researchLayerModal');
  }

  openVariableRegistrationModal(): void {
    this.showVariableSuccessMessage = false;
    this.isSending = false;
    this.openModal('variableModal');
  }

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
        console.error('Error submitting registration:', error);
        alert('Error al enviar la solicitud de registro. Intenta de nuevo.');
      } finally {
        this.isSending = false;
        this.cdRef.detectChanges();
      }
    }
  }

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
        console.error('Error submitting research layer:', error);
        alert('Error al enviar la solicitud de capa. Intenta de nuevo.');
      } finally {
        this.isSending = false;
        this.cdRef.detectChanges();
      }
    }
  }

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
        console.error('Error submitting variable:', error);
        alert('Error al enviar la solicitud de variable. Intenta de nuevo.');
      } finally {
        this.isSending = false;
        this.cdRef.detectChanges();
      }
    }
  }

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
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN DEL SOLICITANTE', 15, 45);
    doc.setFont('helvetica', 'normal');
    let yPosition = 55;
    doc.text(`• Nombre completo: ${formData.nombre} ${formData.apellido}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Tipo de documento: ${this.getDocumentTypeName(formData.tipoDocumento)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Número de documento: ${formData.numeroDocumento}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Fecha de nacimiento: ${formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toLocaleDateString() : ''}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Correo electrónico: ${formData.email}`, 20, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('2. DETALLES DEL REGISTRO', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    doc.text(`• Rol: ${this.getRoleName(formData.rol)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Capa de investigación: ${formData.capaInvestigacion}`, 20, yPosition);
    yPosition += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('3. RESPONSABLE DEL REGISTRO', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    doc.text(`• Nombre del responsable: ${formData.responsable}`, 20, yPosition);
    yPosition += 12;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Nota: Esta solicitud será revisada por el equipo administrativo del RPE.', 15, yPosition);
    yPosition += 5;
    doc.text('Se notificará al correo electrónico proporcionado una vez procesada.', 15, yPosition);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© Registro Poblacional de Epilepsia - Universidad del Valle', 105, 290, { align: 'center' });
    return doc;
  }

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
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN DE LA CAPA DE INVESTIGACIÓN', 15, 45);
    doc.setFont('helvetica', 'normal');
    let yPosition = 55;
    doc.text(`• Nombre de la capa: ${formData.layerName}`, 20, yPosition);
    yPosition += 7;
    const descriptionLines = doc.splitTextToSize(`• Descripción: ${formData.description}`, 170);
    doc.text(descriptionLines, 20, yPosition);
    yPosition += descriptionLines.length * 7 + 5;
    doc.setFont('helvetica', 'bold');
    doc.text('2. RESPONSABLE DE LA CAPA', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    doc.text(`• Nombre del responsable: ${formData.layerBossName}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Número de identificación: ${formData.layerBossId}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Correo electrónico: ${formData.layerBossEmail}`, 20, yPosition);
    yPosition += 12;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Nota: Esta solicitud será revisada por el equipo administrativo del RPE.', 15, yPosition);
    yPosition += 5;
    doc.text('Se notificará al correo electrónico del responsable una vez procesada.', 15, yPosition);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© Registro Poblacional de Epilepsia - Universidad del Valle', 105, 290, { align: 'center' });
    return doc;
  }

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
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN DE LA VARIABLE', 15, 45);
    doc.setFont('helvetica', 'normal');
    let yPosition = 55;
    doc.text(`• ID de la capa de investigación: ${formData.researchLayerId}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Nombre de la variable: ${formData.variableName}`, 20, yPosition);
    yPosition += 7;
    const descriptionLines = doc.splitTextToSize(`• Descripción: ${formData.description}`, 170);
    doc.text(descriptionLines, 20, yPosition);
    yPosition += descriptionLines.length * 7 + 5;
    doc.text(`• Tipo: ${formData.type}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Tiene opciones: ${formData.hasOptions ? 'Sí' : 'No'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Opciones: ${formData.options || 'N/A'}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Habilitada: ${formData.isEnabled ? 'Sí' : 'No'}`, 20, yPosition);
    yPosition += 12;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Nota: Esta solicitud será revisada por el equipo administrativo del RPE.', 15, yPosition);
    yPosition += 5;
    doc.text('Se notificará al correo correspondiente una vez procesada.', 15, yPosition);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© Registro Poblacional de Epilepsia - Universidad del Valle', 105, 290, { align: 'center' });
    return doc;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

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
      attachment: pdfBase64,
      message: 'Nueva solicitud de registro de usuario'
    };

    return emailjs.send('service_km76q7v', 'template_fwneuqt', templateParams); // Replace with your EmailJS service and template IDs
  }

  async sendResearchLayerEmail(pdfBlob: Blob): Promise<EmailJSResponseStatus> {
    const formData = this.researchLayerForm.value;
    const pdfBase64 = await this.blobToBase64(pdfBlob);
    const templateParams = {
      to_name: 'Administrador RPE',
      from_name: formData.layerBossName,
      from_email: formData.layerBossEmail,
      layer_name: formData.layerName,
      description: formData.description,
      boss_id: formData.layerBossId,
      attachment: pdfBase64,
      message: 'Nueva solicitud de registro de capa de investigación'
    };

    return emailjs.send('service_km76q7v',
      'template_fwneuqt', templateParams);
  }

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

    return emailjs.send('service_km76q7v',
      'template_fwneuqt', templateParams); // Replace with your EmailJS service and template IDs
  }

  getDocumentTypeName(type: string): string {
    const types: { [key: string]: string } = {
      'CC': 'Cédula de Ciudadanía',
      'CE': 'Cédula de Extranjería',
      'PA': 'Pasaporte',
      'TI': 'Tarjeta de Identidad'
    };
    return types[type] || type;
  }

  getRoleName(role: string): string {
    const roles: { [key: string]: string } = {
      'investigador': 'Investigador',
      'doctor': 'Doctor',
      'administrador': 'Administrador'
    };
    return roles[role] || role;
  }

  // Agrega estos métodos a tu clase
  openPasswordChangeModal(): void {
    this.showPasswordChangeSuccess = false;
    this.isSending = false;
    this.passwordChangeForm.reset();
    this.openModal('passwordChangeModal');
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordMatchValidator(formGroup: FormGroup): { [key: string]: any } | null {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async submitPasswordChange(): Promise<void> {
    if (this.passwordChangeForm.valid) {
      this.isSending = true;
      try {
        const pdfDoc = this.generatePasswordChangePDF();
        const pdfBlob = pdfDoc.output('blob');
        await this.sendPasswordChangeEmail(pdfBlob);
        this.showPasswordChangeSuccess = true;
      } catch (error) {
        console.error('Error submitting password change:', error);
        alert('Error al enviar la solicitud de cambio de contraseña. Intenta de nuevo.');
      } finally {
        this.isSending = false;
        this.cdRef.detectChanges();
      }
    } else {
      this.markFormGroupTouched(this.passwordChangeForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

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
    doc.text(`• Correo electrónico: ${formData.email}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Número de identificación: ${formData.identificationNumber}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Rol en el sistema: ${this.getRoleName(formData.role)}`, 20, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('2. DETALLES DEL CAMBIO', 15, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;

    doc.text(`• Motivo del cambio: ${this.getReasonName(formData.reason)}`, 20, yPosition);
    yPosition += 7;

    if (formData.reason === 'otro' && formData.otherReason) {
      const otherReasonLines = doc.splitTextToSize(`• Especificación: ${formData.otherReason}`, 170);
      doc.text(otherReasonLines, 20, yPosition);
      yPosition += otherReasonLines.length * 7;
    }

    yPosition += 12;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Nota: Esta solicitud será revisada por el equipo administrativo del RPE.', 15, yPosition);
    yPosition += 5;
    doc.text('Se notificará al correo electrónico proporcionado una vez procesada.', 15, yPosition);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© Registro Poblacional de Epilepsia - Universidad del Valle', 105, 290, { align: 'center' });

    return doc;
  }

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

  getReasonName(reason: string): string {
    const reasons: { [key: string]: string } = {
      'olvido': 'Olvidé mi contraseña',
      'seguridad': 'Motivos de seguridad',
      'primera_vez': 'Primer acceso al sistema',
      'otro': 'Otro motivo'
    };
    return reasons[reason] || reason;
  }
}
