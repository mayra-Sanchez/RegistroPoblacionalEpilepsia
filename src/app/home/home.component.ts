import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as L from 'leaflet';
import emailjs, { EmailJSResponseStatus } from 'emailjs-com';
import { jsPDF } from 'jspdf';

interface Institucion {
  id: number;
  nombre: string;
  tipo: string;
  imagen: string;
  descripcionCorta: string;
  descripcionCompleta: string;
  direccion: string;
  telefono: string;
  sitioWeb: string;
  coordenadas: { lat: number; lng: number };
}

interface Persona {
  id: string;
  nombre: string;
  rol: string;
  imagen: string;
  etiquetas: string[];
  biografia: string;
  formacion: string[];
  contacto: { email: string; oficina: string };
  proyectos: string[];
  redesSociales: {
    linkedin?: string;
    researchgate?: string;
    scholar?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {
  registrationForm: FormGroup;
  researchLayerForm: FormGroup;
  variableForm: FormGroup;
  isSending = false;
  showSuccessMessage = false;
  showLayerSuccessMessage = false;
  showVariableSuccessMessage = false;
  selectedTab: string = 'inicio';
  personaSeleccionada: Persona | null = null;
  institucionSeleccionada: Institucion | null = null;
  private map: any;

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder) {
    emailjs.init('xKoiAF8rBlTus7c0oD'); // Replace with your actual EmailJS user ID

    // User Registration Form
    this.registrationForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      tipoDocumento: ['', [Validators.required]],
      numeroDocumento: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      fechaNacimiento: ['', [Validators.required]],
      rol: ['', [Validators.required]],
      capaInvestigacion: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      responsable: ['', [Validators.required]]
    });

    // Research Layer Form
    this.researchLayerForm = this.fb.group({
      layerName: ['', [Validators.required]],
      description: ['', [Validators.required]],
      layerBossName: ['', [Validators.required]],
      layerBossId: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      layerBossEmail: ['', [Validators.required, Validators.email]]
    });

    // Variable Form
    this.variableForm = this.fb.group({
      researchLayerId: ['', [Validators.required]],
      variableName: ['', [Validators.required]],
      description: ['', [Validators.required]],
      type: ['', [Validators.required]],
      hasOptions: [false],
      isEnabled: [true],
      options: ['']
    });

    // Conditional validation for options field
    this.variableForm.get('hasOptions')?.valueChanges.subscribe(hasOptions => {
      const optionsControl = this.variableForm.get('options');
      if (hasOptions) {
        optionsControl?.setValidators([Validators.required]);
      } else {
        optionsControl?.clearValidators();
      }
      optionsControl?.updateValueAndValidity();
    });
  }

  instituciones: Institucion[] = [
    {
      id: 1,
      nombre: 'Hospital Universitario Psiquiátrico del Valle',
      tipo: 'Hospital Público',
      imagen: '../../assets/img/hupdv.jpg',
      descripcionCorta: 'Especializado en trastornos mentales y neurológicos...',
      descripcionCompleta: 'El Hospital Universitario Psiquiátrico del Valle se especializa en el tratamiento de trastornos mentales y neurológicos, incluyendo epilepsia, con un enfoque en atención integral y apoyo a la investigación clínica.',
      direccion: 'Calle 10 # 10-28, Cali, Valle del Cauca',
      telefono: '+57 602 524 0000',
      sitioWeb: 'https://www.hupv.gov.co',
      coordenadas: { lat: 3.4516, lng: -76.5319 }
    },
    {
      id: 2,
      nombre: 'Hospital Universitario del Valle (HUV)',
      tipo: 'Hospital Público',
      imagen: '../../assets/img/huv.png',
      descripcionCorta: 'Referente en atención médica e investigación clínica...',
      descripcionCompleta: 'El Hospital Universitario del Valle es un referente en atención médica e investigación clínica en el suroccidente colombiano, especializado en enfermedades complejas como la epilepsia.',
      direccion: 'Cra. 36 # 5B-08, Cali, Valle del Cauca',
      telefono: '+57 602 518 5600',
      sitioWeb: 'https://www.hospitaluniversitario.gov.co',
      coordenadas: { lat: 3.4345, lng: -76.5408 }
    },
    {
      id: 3,
      nombre: 'Clínica Imbanaco',
      tipo: 'Clínica Privada',
      imagen: '../../assets/img/clinica-imbanaco-logo.jpg',
      descripcionCorta: 'Institución de alta complejidad...',
      descripcionCompleta: 'Clínica Imbanaco es una institución de alta complejidad reconocida por su innovación médica y tratamiento de enfermedades neurológicas, incluyendo la epilepsia.',
      direccion: 'Cra. 38A # 5A-100, Cali, Valle del Cauca',
      telefono: '+57 602 682 1000',
      sitioWeb: 'https://www.imbanaco.com',
      coordenadas: { lat: 3.4205, lng: -76.5472 }
    },
    {
      id: 4,
      nombre: 'Universidad del Valle',
      tipo: 'Universidad Pública',
      imagen: '../../assets/logo_uv.png',
      descripcionCorta: 'Institución educativa prestigiosa...',
      descripcionCompleta: 'La Universidad del Valle es una de las instituciones educativas más prestigiosas de Colombia, con contribuciones significativas a la investigación en salud y tecnología.',
      direccion: 'Ciudad Universitaria Meléndez, Calle 13 # 100-00, Cali',
      telefono: '+57 602 321 2100',
      sitioWeb: 'https://www.univalle.edu.co',
      coordenadas: { lat: 3.3759, lng: -76.5305 }
    },
    {
      id: 5,
      nombre: 'Laboratorio Multimedia y Visión por Computador (MVC)',
      tipo: 'Laboratorio de Investigación',
      imagen: '../../assets/img/Multimedia-y-visión.png',
      descripcionCorta: 'Centro líder en tecnologías innovadoras...',
      descripcionCompleta: 'El Laboratorio Multimedia y Visión por Computador de la Universidad del Valle lidera proyectos en procesamiento de señales médicas y sistemas de apoyo al diagnóstico.',
      direccion: 'Edificio B13, Ciudad Universitaria Meléndez, Cali',
      telefono: '+57 602 321 2100',
      sitioWeb: 'https://mvc.univalle.edu.co',
      coordenadas: { lat: 3.3762, lng: -76.5318 }
    }
  ];

  personas: Persona[] = [
    {
      id: 'patricia',
      nombre: 'Maria Patricia Trujillo Uribe',
      rol: 'Directora',
      imagen: '../../assets/directores_estudiantes/paty.png',
      etiquetas: ['Directora', 'Docente'],
      biografia: 'María Patricia Trujillo Uribe es Directora y Docente en la Universidad del Valle, con un Doctorado en Ingeniería Electrónica...',
      formacion: [
        'Doctorado en Ingeniería Electrónica - Universidad de Londres',
        'Maestría en Ciencias - Colegio De Posgraduados',
        'Pregrado Estadística - Universidad del Valle'
      ],
      contacto: {
        email: 'maria.trujillo@correounivalle.edu.co',
        oficina: 'Edificio B13: 4002 - Universidad del Valle'
      },
      proyectos: [
        'Segmentación Automática de Hígado en Imágenes Médicas, 2009-2010',
        'Sistema distribuido de anotación automática, 2010-2011'
      ],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/maria-patricia-trujillo-uribe-985bb32a0/',
        scholar: 'https://scholar.google.com.co/citations?user=8-ywnPAAAAAJ&hl=en'
      }
    },
    {
      id: 'deisy',
      nombre: 'Deisy Chaves Sánchez',
      rol: 'Directora',
      imagen: '../../assets/directores_estudiantes/deisy.jpg',
      etiquetas: ['Docente', 'Investigadora', 'Directora'],
      biografia: 'Deisy Chaves Sánchez es Directora, Docente e Investigadora en la Universidad del Valle, con doctorados en Ciencias de la Computación...',
      formacion: [
        'Doctorado en Ingeniería - Universidad del Valle',
        'Maestría en Ingeniería - Universidad del Valle'
      ],
      contacto: {
        email: 'deisy.chaves@correounivalle.edu.co',
        oficina: 'Oficina 10, Edificio B13 - Universidad del Valle'
      },
      proyectos: [
        'Automatic reactivity characterisation of char particles, 2018',
        'PSIQUE: A Computerised Neuropsychological Assessment App, 2021'
      ],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/deisychaves/'
      }
    },
    {
      id: 'jhon',
      nombre: 'Jhon Mauro Gómez Benitez',
      rol: 'Director',
      imagen: '../../assets/directores_estudiantes/jhonma.jpg',
      etiquetas: ['Director'],
      biografia: 'Jhon Mauro Gómez Benitez es Director e Investigador con formación en Ciencias de la Computación e Imágenes Médicas...',
      formacion: [
        'Maestría en Imágenes Médicas - Universitat de Girona',
        'Licenciatura en Ciencias de la Computación - Universidad del Valle'
      ],
      contacto: {
        email: 'jhonmauro@gmail.com',
        oficina: 'Ámsterdam, Países Bajos'
      },
      proyectos: ['Federated learning for rare cancer detection, 2022'],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/jhonmauro/'
      }
    },
    {
      id: 'alejandro',
      nombre: 'Alejandro Herrera Trujillo',
      rol: 'Director',
      imagen: '../../assets/directores_estudiantes/Alejandro_Herrera_Trujillo.png',
      etiquetas: ['Director', 'Investigador', 'Docente', 'Médico'],
      biografia: 'El Dr. Alejandro Herrera Trujillo es egresado de la Universidad del Valle como Cirujano General, especializado en Neurocirugía...',
      formacion: [
        'Doctorado en Ciencias Biomédicas - Universidad del Valle',
        'Especialidad en Neurocirugía - Universidad del Valle'
      ],
      contacto: {
        email: 'alejandro.herrera@correounivalle.edu.co',
        oficina: 'Clínica Imbanaco: Torre B, Cons. 601'
      },
      proyectos: ['Resultado quirúrgico en epilepsia fármaco resistente, 2013'],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/alejandro-herrera-trujillo-54377ba4/'
      }
    },
    {
      id: 'juan',
      nombre: 'Juan Carlos Rivas Nieto',
      rol: 'Director',
      imagen: '../../assets/directores_estudiantes/Rivas.jpg',
      etiquetas: ['Director', 'Médico - Psiquiatra', 'Docente'],
      biografia: 'El psiquiatra Juan Carlos Rivas Nieto es un destacado especialista en neuropsiquiatría...',
      formacion: ['Especialidad en Psiquiatría - Universidad del Valle'],
      contacto: {
        email: 'juan.rivas@correounivalle.edu.co',
        oficina: 'Hospital Universitario Fundación Valle del Lili'
      },
      proyectos: ['Imagen cerebral en esquizofrenia, 2013'],
      redesSociales: {
        researchgate: 'https://www.researchgate.net/profile/Juan-Rivas-Nieto'
      }
    },
    {
      id: 'mayra',
      nombre: 'Mayra Alejandra Sánchez Salinas',
      rol: 'Estudiante',
      imagen: '../../assets/directores_estudiantes/may.jpg',
      etiquetas: ['Estudiante', 'Desarrolladora Frontend'],
      biografia: 'Estudiante de Ingeniería de Sistemas en la Universidad del Valle, con interés en desarrollo de software...',
      formacion: ['Ingeniería de Sistemas - Universidad del Valle'],
      contacto: {
        email: 'mayra.alejandra.sanchez@correounivalle.edu.co',
        oficina: 'Laboratorio MVC - Edificio B13'
      },
      proyectos: ['Registro Poblacional de Epilepsia - Desarrollo Frontend'],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/mayra-sanchez-577183235/'
      }
    },
    {
      id: 'laura',
      nombre: 'Laura Daniela Jaimes Cárdenas',
      rol: 'Estudiante',
      imagen: '../../assets/directores_estudiantes/laura.jpg',
      etiquetas: ['Estudiante', 'Desarrolladora Backend'],
      biografia: 'Estudiante de Ingeniería de Sistemas en la Universidad del Valle, con interés en inteligencia artificial...',
      formacion: ['Ingeniería de Sistemas - Universidad del Valle'],
      contacto: {
        email: 'laura.jaimes@correounivalle.edu.co',
        oficina: 'Laboratorio MVC - Edificio B13'
      },
      proyectos: ['Registro Poblacional de Epilepsia - Desarrollo Backend'],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/laura-jaimes-cardenas-35878a24a/'
      }
    }
  ];

  ngAfterViewInit() {
    this.loadLeafletStyles();
  }

  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

  openPersonaModal(personaId: string): void {
    this.personaSeleccionada = this.personas.find(p => p.id === personaId) || null;
    this.cdRef.detectChanges();
    setTimeout(() => this.openModal('personaDetailModal'), 10);
  }

  loadLeafletStyles(): void {
    const leafletStyle = document.createElement('link');
    leafletStyle.rel = 'stylesheet';
    leafletStyle.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(leafletStyle);
  }

openInstitucionModal(institucion: Institucion): void {
  this.closeModal('institucionesModal');
  
  if (this.map) {
    this.map.remove();
    this.map = null;
  }
  this.institucionSeleccionada = institucion;
  this.cdRef.detectChanges();
  
  setTimeout(() => {
    this.openModal('institucionDetailModal');
    this.initMap();
  }, 100);
}

  initMap(): void {
    if (!this.institucionSeleccionada) return;
    const institucion = this.institucionSeleccionada;

    setTimeout(() => {
      const mapContainer = document.getElementById('mapContainer');
      if (!mapContainer) return;
      mapContainer.innerHTML = '';
      const coord = institucion.coordenadas;
      this.map = L.map('mapContainer').setView([coord.lat, coord.lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
      L.marker([coord.lat, coord.lng])
        .addTo(this.map)
        .bindPopup(`<b>${institucion.nombre}</b><br>${institucion.direccion}`)
        .openPopup();
      setTimeout(() => this.map.invalidateSize(), 0);
    }, 0);
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
    
    if (modalId === 'institucionDetailModal') {
      this.institucionSeleccionada = null;
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
    }
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

    return emailjs.send('your_service_id', 'your_template_id', templateParams); // Replace with your EmailJS service and template IDs
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
}