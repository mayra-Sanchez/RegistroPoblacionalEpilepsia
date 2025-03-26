import { Component, ChangeDetectorRef } from '@angular/core';

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
export class HomeComponent {
  constructor(private cdRef: ChangeDetectorRef) { }
  selectedTab: string = 'inicio';
  personaSeleccionada: Persona | null = null;

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
      rol: 'Estudiante',
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
      rol: 'Estudiante',
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