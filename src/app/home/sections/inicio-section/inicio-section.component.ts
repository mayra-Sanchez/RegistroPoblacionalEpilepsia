import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as L from 'leaflet';

interface Institucion {
  id: number;
  nombre: string;
  tipo: string;
  imagen: string;
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
  selector: 'app-inicio-section',
  templateUrl: './inicio-section.component.html',
  styleUrls: ['./inicio-section.component.css']
})
export class InicioSectionComponent implements AfterViewInit {
  personaSeleccionada: Persona | null = null;
  institucionSeleccionada: Institucion | null = null;

  private map: any;
  instituciones: Institucion[] = [
    {
      id: 1,
      nombre: 'Hospital Universitario Psiquiátrico del Valle',
      tipo: 'Hospital Público',
      imagen: '../../assets/img/hupdv.jpg',
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

  constructor(private cdRef: ChangeDetectorRef) {}
  animateCardClick(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    card.classList.add('clicked');
    setTimeout(() => card.classList.remove('clicked'), 300);
  }

  openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
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

  ngAfterViewInit() {
    this.loadLeafletStyles();
  }

}
