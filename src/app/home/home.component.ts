import { Component, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
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
  coordenadas: {
    lat: number;
    lng: number;
  };
}

interface Persona {
  id: string;
  nombre: string;
  rol: string;
  imagen: string;
  etiquetas: string[];
  biografia: string;
  formacion: string[];
  contacto: {
    email: string;
    oficina: string;
  };
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
  isSending = false;
  showSuccessMessage = false;

  constructor(private cdRef: ChangeDetectorRef, private fb: FormBuilder) {
    // Inicializa EmailJS (reemplaza con tus credenciales)
    emailjs.init('xK_AFqrBlOus7c0oD');
    
    this.registrationForm = this.fb.group({
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      tipoDocumento: new FormControl('', [Validators.required]),
      numeroDocumento: new FormControl('', [Validators.required, Validators.pattern('^[0-9]+$')]),
      fechaNacimiento: new FormControl('', [Validators.required]),
      rol: new FormControl('', [Validators.required]),
      capaInvestigacion: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      responsable: new FormControl('', [Validators.required])
    });
  }

  selectedTab: string = 'inicio';
  personaSeleccionada: Persona | null = null;
  instituciones: Institucion[] = [
    {
      id: 1,
      nombre: 'Hospital Universitario Psiquiátrico del Valle',
      tipo: 'Hospital Público',
      imagen: '../../assets/img/hupdv.jpg',
      descripcionCorta: 'Especializado en trastornos mentales y neurológicos...',
      descripcionCompleta: 'El Hospital Universitario Psiquiátrico del Valle se especializa en el tratamiento de trastornos mentales y neurológicos...',
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
      descripcionCorta: 'Referente en atención médica e investigación clínica en el suroccidente colombiano...',
      descripcionCompleta: 'El Hospital Universitario del Valle es un referente en atención médica e investigación clínica en el suroccidente colombiano, especializado en el tratamiento de enfermedades complejas como la epilepsia. Vinculado a la Universidad del Valle, es centro de formación de especialistas médicos.',
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
      descripcionCorta: 'Institución de alta complejidad reconocida por innovación médica...',
      descripcionCompleta: 'Clínica Imbanaco es una institución de salud de alta complejidad, reconocida por su enfoque en la innovación médica y el tratamiento de enfermedades neurológicas, incluyendo la epilepsia. Cuenta con tecnología de punta y especialistas de alto nivel.',
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
      descripcionCorta: 'Institución educativa prestigiosa con contribución a investigación en salud...',
      descripcionCompleta: 'La Universidad del Valle es una de las instituciones educativas más prestigiosas de Colombia, reconocida por su excelencia académica y su contribución a la investigación en salud y tecnología. Facultad de Medicina es referente nacional en formación médica.',
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
      descripcionCorta: 'Centro líder en desarrollo de tecnologías innovadoras aplicadas a salud...',
      descripcionCompleta: 'El Laboratorio Multimedia y Visión por Computador de la Universidad del Valle es un centro de investigación líder en el desarrollo de tecnologías innovadoras aplicadas a la salud, con proyectos en procesamiento de señales médicas y sistemas de apoyo al diagnóstico.',
      direccion: 'Edificio B13, Ciudad Universitaria Meléndez, Cali',
      telefono: '+57 602 321 2100',
      sitioWeb: 'https://mvc.univalle.edu.co',
      coordenadas: { lat: 3.3762, lng: -76.5318 }
    }
  ];

  institucionSeleccionada: Institucion | null = null;
  private map: any;

  // Datos de todas las personas
  personas: Persona[] = [
    {
      id: 'patricia',
      nombre: 'Maria Patricia Trujillo Uribe',
      rol: 'Directora',
      imagen: '../../assets/directores_estudiantes/paty.png',
      etiquetas: ['Directora', 'Docente'],
      biografia: 'María Patricia Trujillo Uribe es Directora y Docente en la Universidad del Valle, con un Doctorado en Ingeniería Electrónica de la Universidad de Londres. Ha liderado proyectos en imágenes médicas, sistemas de anotación semántica y plataformas de recomendación, entre otros proyectos interesantes. Su trabajo combina investigación y tecnología para el avance de la ciencia. Destaca por su compromiso con la educación y la innovación.',
      formacion: [
        'Doctorado en Ingeniería Electrónica - Universidad de Londres',
        'Maestría en Ciencias - Colegio De Posgraduados',
        'Pregrado estadistica - Universidad del Valle'
      ],
      contacto: {
        email: 'maria.trujillo@correounivalle.edu.co',
        oficina: 'Edificio B13: 4002 - Universidad del Valle'
      },
      proyectos: [
        'Segmentación Automática de Hígado en Imágenes Médicas, 2009-2010',
        'Sistema distribuido de anotación automática y recuperación semántica de imágenes de histología, 2010 - 2011',
        'Integrando información enriquecida semánticamente como apoyo al diagnóstico de enfermedades del hígado, 2010 - 2012',
        'Plataforma Experimental para Sistemas de Recomendación, Descubrimiento de Conocimiento, Interfaces Adaptativas y Consultas Avanzadas: PREDICA, 2006',
        'Clasificación Automática de Imágenes Digitales Provenientes de un Proceso de Desvolatilización de Carbón, 2007 - 2009',
        'PLAYTHERAPY: videojuego de apoyo a terapias de recuperación física, 2016 - 2018',
      ],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/maria-patricia-trujillo-uribe-985bb32a0/',
        scholar: 'https://scholar.google.com.co/citations?user=8-ywnPAAAAAJ&hl=en',
      }
    },
    {
      id: 'deisy',
      nombre: 'Deisy Chaves Sánchez',
      rol: 'Directora',
      imagen: '../../assets/directores_estudiantes/deisy.jpg',
      etiquetas: ['Docente', 'Investigadora', 'Directora'],
      biografia: 'Deisy Chaves Sánchez es Directora, Docente e Investigadora en la Universidad del Valle, con doctorados en Ciencias de la Computación y Producción. Su trabajo se centra en visión por computadora, inteligencia artificial y análisis de imágenes, aplicados a áreas como la neuropsicología y la detección de contenido digital. Ha liderado múltiples proyectos de investigación innovadores.',
      formacion: [
        'Doctorado en Ingeniería con Énfasis en Ciencias de la Computación - Universidad del Valle',
        'Doctorado en Ingeniería y Producción - Universidad de León',
        'Maestría en Ingeniería con Énfasis en Ciencias de la Computación - Universidad del Valle',
        'Licenciatura en Ingeniería de Sistemas - Universidad del valle'
      ],
      contacto: {
        email: 'Deisy.chaves@correounivalle.edu.co',
        oficina: 'Oficina 10, Edificio B13 - Universidad del Valle'
      },
      proyectos: [
        'Automatic reactivity characterisation of char particles from pulverised coal combustion using computer vision (2018)',
        'An image processing system for char combustion reactivity characterisation (2019)',
        'Improving age estimation in minors and young adults with occluded faces to fight against child sexual exploitation (2020)',
        'PSIQUE: A Computerised Neuropsychological Assessment App (2021)',
        'Semantic Attention Keypoint Filtering for DarknetContent Classification (2022)',
        'A Data Augmentation Strategy for Improving Age Estimation to Support CSEM Detection (2023)',
      ],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/deisychaves/',
        researchgate: 'https://portalcientifico.unileon.es/investigadores/1203689/publicaciones',
      }
    },
    {
      id: 'jhon',
      nombre: 'Jhon Mauro Gómez Benitez',
      rol: 'Director',
      imagen: '../../assets/directores_estudiantes/jhonma.jpg',
      etiquetas: ['Director'],
      biografia: 'Jhon Mauro Gómez Benitez es Director e Investigador con una sólida formación en Ciencias de la Computación e Imágenes Médicas, obtenida en instituciones como la Universitat de Girona, Università degli Studi di Cassino e del Lazio Meridionale y Université Bourgogne Europe. Su trayectoria incluye investigaciones en visión por computadora e inteligencia artificial, enfocadas en reducción de desenfoque en imágenes médicas y aprendizaje federado para la detección de cáncer raro. Actualmente, desarrolla su trabajo en Ámsterdam, Países Bajos, contribuyendo a la tecnologia',
      formacion: [
        'Maestría en Imágenes Médicas y Aplicaciones, Ciencias de la Computación - Universitat de Girona (2018 - 2020)',
        'Maestría en Imágenes Médicas y Aplicaciones, Ciencias de la Computación - Università degli Studi di Cassino e del Lazio Meridionale (2018 - 2020)',
        'Maestría en Imágenes Médicas y Aplicaciones, Ciencias de la Computación - Université Bourgogne Europe (2018 - 2020)',
        'Licenciatura en Ciencias de la Computación - Universidad del Valle (2009 - 2015)',
      ],
      contacto: {
        email: 'jhonmauro@gmail.com',
        oficina: 'Ámsterdam, Holanda Septentrional, Países Bajos'
      },
      proyectos: [
        'Miembro de MVC (Multimedia and Computer Vision Laboratory) - Investigación en algoritmos de reducción de desenfoque para imágenes de partículas de carbón',
        'Federated learning enables big data for rare cancer boundary detection (2022)',
      ],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/jhonmauro/',
      }
    },
    {
      id: 'alejandro',
      nombre: 'Alejandro Herrera Trujillo',
      rol: 'Director',
      imagen: '../../assets/directores_estudiantes/Alejandro_Herrera_Trujillo.png',
      etiquetas: ['Director', 'Investigador', 'Docente', 'Médico'],
      biografia: 'Dentro del campo de la Neurocirugía se encuentra el Dr. Alejandro Herrera Trujillo, quien es egresado de la Universidad del Valle - Escuela de Medicina como Cirujano General. Posteriormente, se especializó en Neurocirugía por la misma institución. Cuenta con un Posgrado de Alta Especialidad. en Cirugía de Epilepsia, el cual está avalado por la Universidad Nacional Autónoma de México (UNAM)',
      formacion: [
        'Doctorado. Ciencias Biomédicas. Universidad del Valle, Centro de Estudios Cerebrales. Calí, Colombia. 2017 - Actualidad',
        'Posgrado. Alta Especialidad. Cirugía de Epilepsia. Universidad Autónoma de México (UNAM), Instituto Nacional de Neurología y Neurocirugía Manuel Velasco Suárez. Ciudad de México, México. 2014 - 2015',
        'Especialidad. Neurocirugía. Universidad del Valle, Hospital Universitario del Valle “Evaristo García”. Calí, Colombia. 2006 - 2011',
        'Jefe de Residentes. Universidad del Valle. Calí, Colombia. 2010 - 2011',
        'Grado Médico. Universidad del Valle, Escuela de Medicina. Calí, Colombia. 1997 - 2004'
      ],
      contacto: {
        email: 'Herrera.alejandro@correounivalle.edu.co - alejandroherrera.asi@quironsalud.com',
        oficina: 'Clínica Imbacano: Torre B, Cons. 601'
      },
      proyectos: [
        'Benedetti-Isaac JC, Zambrano MT, Fandiño J, Dusan J, Herrera A, Olivares R Alcala Gabriel. Resultado quirúrgico a largo plazo en pacientes con epilepsia fármaco resistente del lóbulo temporal sin anormalidades histológicas Neurologia; 28(9): 543-549, nov.-dic. 2013',
        'Rodríguez DF, Escobar OA, Orozco J, Herrera A, Villarreal A, Llanos C. Arteria de Adam Kiewicz: Importancia anatómica y reto terapéutico. Neurocien Colom 2010; 17(2) : 15-26'
      ],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/alejandro-herrera-trujillo-54377ba4/',
        researchgate: 'https://www.researchgate.net/profile/Alejandro-Herrera-Trujillo',
      }
    },
    {
      id: 'juan',
      nombre: 'Juan Carlos Rivas Nieto',
      rol: 'Director',
      imagen: '../../assets/directores_estudiantes/Rivas.jpg',
      etiquetas: ['Director', 'Médico - psiquiatra', 'Docente'],
      biografia: 'El psiquiatra Juan Carlos Rivas Nieto es un destacado especialista en el área de la Psiquiatría, con experiencia en neuropsiquiatría, investigación en imagen cerebral y docencia universitaria.',
      formacion: [
        '',
        '',
        ''
      ],
      contacto: {
        email: 'jcrn12@gmail.com - juan.c.rivas@correounivalle.edu.co',
        oficina: 'Hospital Universitario Fundación Valle del Lili'
      },
      proyectos: [
        'Frontotemporal dementia: clinical, neuropsychological, and neuroimaging description (2014)',
        'Imagen cerebral en esquizofrenia (2013)',
      ],
      redesSociales: {
        researchgate: 'https://www.researchgate.net/profile/Juan-Rivas-Nieto',
        scholar: 'https://scholar.google.com.co/citations?user=eE-h2nYAAAAJ&hl=es',
      }
    },
    {
      id: 'mayra',
      nombre: 'Mayra Alejandra Sánchez Salinas',
      rol: 'Estudiante / Desarrolladora frontend',
      imagen: '../../assets/directores_estudiantes/may.jpg',
      etiquetas: ['Estudiante', 'Investigadora'],
      biografia: 'Estudiante de Ingeniería de Sistemas en la Universidad del Valle, con interés en el desarrollo de software, bases de datos y análisis de datos. Ha participado en proyectos de investigación en el área de salud y tecnología.',
      formacion: [
        'Ingeniería de Sistemas - Universidad del Valle'
      ],
      contacto: {
        email: 'mayra.alejandra.sanchez@correounivalle.edu.co - mayralejadra2003@gmail.com',
        oficina: 'Laboratorio MVC - Edificio B13 - Universidad del Valle'
      },
      proyectos: [
        'Registro Poblacional de Epilepsia - Desarrollo de software y análisis de datos'
      ],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/mayra-s%C3%A1nchez-577183235/'
      }
    },
    {
      id: 'laura',
      nombre: 'Laura Daniela Jaimes Cárdenas',
      rol: 'Estudiante / Desarrolladora backend',
      imagen: '../../assets/directores_estudiantes/laura.jpg',
      etiquetas: ['Estudiante', 'Investigadora'],
      biografia: 'Estudiante de Ingeniería de Sistemas en la Universidad del Valle, con interés en inteligencia artificial, visión por computadora y desarrollo de software. Ha participado en proyectos relacionados con el análisis de imágenes médicas y salud digital.',
      formacion: [
        'Ingeniería de Sistemas - Universidad del Valle'
      ],
      contacto: {
        email: 'laura.jaimes@correounivalle.edu.co',
        oficina: 'Laboratorio MVC - Edificio B13 - Universidad del Valle'
      },
      proyectos: [
        'Registro Poblacional de Epilepsia - Análisis de datos y desarrollo de software'
      ],
      redesSociales: {
        linkedin: 'https://www.linkedin.com/in/laura-daniela-jaimes-cardenas-35878a24a/'
      }
    }
    ,
  ];

  ngAfterViewInit() {
    this.loadLeafletStyles();
  }

  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

  // Abre el modal con los datos de la persona seleccionada
  openPersonaModal(personaId: string): void {
    this.personaSeleccionada = this.personas.find(p => p.id === personaId) || null;
    this.cdRef.detectChanges(); // Forzar detección de cambios

    setTimeout(() => {
      this.openModal('personaDetailModal');
    }, 10);
  }
  loadLeafletStyles() {
    const leafletStyle = document.createElement('link');
    leafletStyle.rel = 'stylesheet';
    leafletStyle.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    document.head.appendChild(leafletStyle);
  }

  openInstitucionModal(institucion: Institucion): void {
    console.log('Abriendo modal para:', institucion.nombre);
    
    // Cerrar mapa existente si hay uno
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
  
    // Esperar a que el DOM esté completamente renderizado
    setTimeout(() => {
      const mapContainer = document.getElementById('mapContainer');
      if (!mapContainer) return;
      
      // Limpiar contenedor del mapa
      mapContainer.innerHTML = '';
      
      const coord = this.institucionSeleccionada!.coordenadas;
      this.map = L.map('mapContainer').setView([coord.lat, coord.lng], 15);
  
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
  
      L.marker([coord.lat, coord.lng])
        .addTo(this.map)
        .bindPopup(`<b>${this.institucionSeleccionada!.nombre}</b><br>${this.institucionSeleccionada!.direccion}`)
        .openPopup();
        
      // Forzar redimensionamiento del mapa
      setTimeout(() => {
        this.map!.invalidateSize();
      }, 0);
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
  
      if (modalId === 'institucionDetailModal' && this.map) {
        this.map.remove();
        this.map = null;
      }
    }
  }

  openRegistrationModal(): void {
    this.showSuccessMessage = false;
    this.openModal('registrationModal');
  }

  async submitRegistration() {
    if (this.registrationForm.valid) {
      this.isSending = true;
      
      try {
        // 1. Generar el PDF con la solicitud
        const pdfDoc = this.generateRegistrationPDF();
        const pdfBlob = pdfDoc.output('blob');
        
        // 2. Enviar el correo con el PDF adjunto
        await this.sendRegistrationEmail(pdfBlob);
        
        // 3. Mostrar mensaje de éxito
        this.showSuccessMessage = true;
        this.registrationForm.reset();
      } catch (error) {
        console.error('Error al enviar la solicitud:', error);
        alert('Ocurrió un error al enviar la solicitud. Por favor inténtalo nuevamente.');
      } finally {
        this.isSending = false;
      }
    }
  }

  generateRegistrationPDF(): jsPDF {
    const formData = this.registrationForm.value;
    const doc = new jsPDF();
    
    // Logo y encabezado
    doc.setFont('helvetica');
    doc.setFontSize(12);
    doc.setTextColor(40, 53, 147);
    doc.setFontSize(16);
    doc.text('REGISTRO POBLACIONAL DE EPILEPSIA (RPE)', 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('SOLICITUD DE REGISTRO DE USUARIO', 105, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`, 105, 32, { align: 'center' });
    
    // Línea divisoria
    doc.setDrawColor(40, 53, 147);
    doc.setLineWidth(0.5);
    doc.line(15, 35, 195, 35);
    
    // Información del solicitante
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('bold');
    doc.text('1. INFORMACIÓN DEL SOLICITANTE', 15, 45);
    doc.setFont('normal');
    
    let yPosition = 55;
    doc.text(`• Nombre completo: ${formData.nombre ?? ''} ${formData.apellido ?? ''}`, 20, yPosition);
    doc.text(`• Tipo de documento: ${this.getDocumentTypeName(formData.tipoDocumento ?? '')}`, 20, yPosition);
    doc.text(`• Número de documento: ${formData.numeroDocumento ?? ''}`, 20, yPosition);
    doc.text(`• Fecha de nacimiento: ${formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toLocaleDateString() : ''}`, 20, yPosition);
    doc.text(`• Correo electrónico: ${formData.email ?? ''}`, 20, yPosition);
    doc.text(`• Nombre de usuario asignado: ${formData.username ?? ''}`, 20, yPosition);
    doc.text(`• Nombre del responsable: ${formData.responsable ?? ''}`, 20, yPosition);
    
    // Detalles del registro
    doc.setFont('bold');
    doc.text('2. DETALLES DEL REGISTRO', 15, yPosition);
    doc.setFont('normal');
    yPosition += 10;
    doc.text(`• Rol solicitado: ${this.getRoleName(formData.rol)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Capa de investigación: ${this.getResearchLayerName(formData.capaInvestigacion)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`• Nombre de usuario asignado: ${formData.username}`, 20, yPosition);
    yPosition += 12;
    
    // Responsable
    doc.setFont('bold');
    doc.text('3. RESPONSABLE DEL REGISTRO', 15, yPosition);
    doc.setFont('normal');
    yPosition += 10;
    doc.text(`• Nombre del responsable: ${formData.responsable}`, 20, yPosition);
    yPosition += 12;
    
    // Notas
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Nota: Esta solicitud será revisada por el equipo administrativo del RPE.', 15, yPosition);
    yPosition += 5;
    doc.text('Se notificará al correo electrónico proporcionado una vez procesada.', 15, yPosition);
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('© Registro Poblacional de Epilepsia - Universidad del Valle', 105, 290, { align: 'center' });
    
    return doc;
  }

  getDocumentTypeName(type: string): string {
    const types: {[key: string]: string} = {
      'CC': 'Cédula de Ciudadanía',
      'CE': 'Cédula de Extranjería',
      'PA': 'Pasaporte',
      'TI': 'Tarjeta de Identidad'
    };
    return types[type] || type;
  }

  getRoleName(role: string): string {
    const roles: {[key: string]: string} = {
      'investigador': 'Investigador',
      'medico': 'Médico',
      'administrador': 'Administrador',
      'auxiliar': 'Auxiliar'
    };
    return roles[role] || role;
  }

  getResearchLayerName(layer: string): string {
    const layers: {[key: string]: string} = {
      'basica': 'Básica',
      'intermedia': 'Intermedia',
      'avanzada': 'Avanzada'
    };
    return layers[layer] || layer;
  }

  async sendRegistrationEmail(pdfBlob: Blob): Promise<EmailJSResponseStatus> {
    const formData = this.registrationForm.value;
    
    const pdfBase64 = await this.blobToBase64(pdfBlob);
    
    const templateParams = {
      to_name: 'Administrador RPE',
      from_name: `${formData.nombre ?? ''} ${formData.apellido ?? ''}`,
      from_email: formData.email ?? '',
      password: formData.password ?? '',  // <-- Nueva línea (contraseña)
      document_type: this.getDocumentTypeName(formData.tipoDocumento ?? ''),
      document_number: formData.numeroDocumento ?? '',
      birth_date: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toLocaleDateString() : '',
      role: this.getRoleName(formData.rol ?? ''),
      research_layer: this.getResearchLayerName(formData.capaInvestigacion ?? ''),
      username: formData.username ?? '',
      responsible: formData.responsable ?? '',
      message: `
        <p>Por favor proceda con el registro de este usuario en el sistema RPE.</p>
        <p><strong>Nota:</strong> La contraseña proporcionada debe ser configurada tal como la ha ingresado el solicitante.</p>
      `,
      attachment: pdfBase64,
      attachment_name: `Solicitud_Registro_${formData.nombre ?? 'usuario'}_${formData.apellido ?? ''}.pdf`
    };
    
    // Enviar el correo usando EmailJS
    return emailjs.send(
      'service_km76q7v',
      'template_fwneuqt',
      templateParams
    );
}

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}