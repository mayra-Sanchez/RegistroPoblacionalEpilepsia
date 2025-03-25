import { Component, ChangeDetectorRef  } from '@angular/core';

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
    telefono: string;
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
export class HomeComponent {
  constructor(private cdRef: ChangeDetectorRef) {}
  selectedTab: string = 'inicio';
  personaSeleccionada: Persona | null = null;
  
  // Datos de todas las personas
  personas: Persona[] = [
    {
      id: 'patricia',
      nombre: 'Maria Patricia Trujillo Uribe',
      rol: 'Directora',
      imagen: '../../assets/directores_estudiantes/paty.png',
      etiquetas: ['Docente', 'Medica'],
      biografia: '',
      formacion: [
        '',
        '',
        ''
      ],
      contacto: {
        email: '',
        telefono: '',
        oficina: ''
      },
      proyectos: [
        '',
        '',
        ''
      ],
      redesSociales: {
        linkedin: '#',
        researchgate: '#',
        scholar: '#',
        twitter: '#',
        facebook: '#',
        instagram: '#',
      }
    },
    {
      id: 'deisy',
      nombre: 'Deisy Chaves Sánchez',
      rol: 'Directora',
      imagen: '../../assets/directores_estudiantes/deisy.jpg',
      etiquetas: ['Docente', 'Investigadora'],
      biografia: 'Directora con amplia experiencia en gestión académica. Especialista en desarrollo curricular y proyectos de investigación. Lideró múltiples iniciativas de innovación educativa y publicó varios artículos en revistas indexadas.',
      formacion: [
        'Doctorado en Ingeniería con Énfasis en Ciencias de la Computación - Universidad del Valle',
        'Doctorado en Ingeniería y Producción - Universidad de León',
        'Maestría en Ingeniería con Énfasis en Ciencias de la Computación - Universidad del Valle',
        'Licenciatura en Ingeniería de Sistemas - Universidad del valle'
      ],
      contacto: {
        email: 'dchaves@universidad.edu',
        telefono: '+57 321 456 7890',
        oficina: 'Oficina 304, Bloque de Ciencias'
      },
      proyectos: [
        'Innovación en metodologías educativas (2020-2022)',
        'Plataforma virtual de aprendizaje (2018-2019)',
        'Investigación sobre competencias digitales docentes (2016-2017)'
      ],
      redesSociales: {
        linkedin: '#',
        researchgate: '#',
        scholar: '#',
        twitter: '#',
        facebook: '#',
        instagram: '#',
      }
    },
    {
      id: 'jhon',
      nombre: 'Jhon Mauro Gómez Benitez',
      rol: 'Director',
      imagen: '../../assets/directores_estudiantes/jhonma.jpg',
      etiquetas: ['Director', ''],
      biografia: '',
      formacion: [
        '',
        '',
        ''
      ],
      contacto: {
        email: '',
        telefono: '',
        oficina: ''
      },
      proyectos: [
        '',
        '',
        ''
      ],
      redesSociales: {
        linkedin: '#',
        researchgate: '#',
        scholar: '#',
        twitter: '#',
        facebook: '#',
        instagram: '#',
      }
    },
    {
      id: 'alejandro',
      nombre: 'Alejandro Herrera Trujillo',
      rol: 'Director',
      imagen: '../../assets/directores_estudiantes/Alejandro_Herrera_Trujillo.png',
      etiquetas: ['Director', ''],
      biografia: '',
      formacion: [
        '',
        '',
        ''
      ],
      contacto: {
        email: '',
        telefono: '',
        oficina: ''
      },
      proyectos: [
        '',
        '',
        ''
      ],
      redesSociales: {
        linkedin: '#',
        researchgate: '#',
        scholar: '#',
        twitter: '#',
        facebook: '#',
        instagram: '#',
      }
    },
    {
      id: 'juan',
      nombre: 'Juan Carlos Rivas Nieto',
      rol: 'Director',
      imagen: '../../assets/directores_estudiantes/Rivas.jpg',
      etiquetas: ['Director', ''],
      biografia: '',
      formacion: [
        '',
        '',
        ''
      ],
      contacto: {
        email: '',
        telefono: '',
        oficina: ''
      },
      proyectos: [
        '',
        '',
        ''
      ],
      redesSociales: {
        linkedin: '#',
        researchgate: '#',
        scholar: '#',
        instagram: '#',
      }
    },
    {
      id: 'mayra',
      nombre: 'Mayra Alejandra Sánchez Salinas',
      rol: 'Estudiante',
      imagen: '../../assets/directores_estudiantes/may.jpg',
      etiquetas: ['Estudiante', ''],
      biografia: '',
      formacion: [
        '',
        '',
        ''
      ],
      contacto: {
        email: '',
        telefono: '',
        oficina: ''
      },
      proyectos: [
        '',
        '',
        ''
      ],
      redesSociales: {
        linkedin: '#',
        researchgate: '#',
        scholar: '#',
        twitter: '#',
        facebook: '#',
        instagram: '#',
      }
    },
    {
      id: 'laura',
      nombre: 'Laura Daniela Jaimes Cardenas',
      rol: 'Estudiante',
      imagen: '../../assets/directores_estudiantes/laura.jpg',
      etiquetas: ['Estudiante', ''],
      biografia: '',
      formacion: [
        '',
        '',
        ''
      ],
      contacto: {
        email: '',
        telefono: '',
        oficina: ''
      },
      proyectos: [
        '',
        '',
        ''
      ],
      redesSociales: {
        linkedin: '#',
        researchgate: '#',
        scholar: '#',
        twitter: '#',
        facebook: '#',
        instagram: '#',
      }
    },
    // Agrega más personas según necesites
  ];

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
  openModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Deshabilita el scroll
    }
  }

  closeModal(modalId: string): void {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto'; // Habilita el scroll
    }
  }
}