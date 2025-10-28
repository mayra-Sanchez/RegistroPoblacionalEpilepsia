// manual.component.ts
import { Component, EventEmitter, Output, HostListener, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

interface ManualSection {
  title: string;
  subtitle: string;
  content: string[];
  subtitle2?: string;
  content2?: string[];
  videoUrl?: string;
  helpImage?: string;
  imageCaption?: string;
  tips?: string[];
  importantNotes?: string[];
  referenceTable?: {
    title: string;
    headers: string[];
    rows: string[][];
  };
  icon: string;
}

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.css']
})
export class ManualComponent implements OnInit {
  currentSection = 0;
  isModalOpen = true;
  filteredSections: ManualSection[];
  searchTerm = '';
  showSearchResults = false;
  searchResultsCount = 0;
  bookmarkedSections: number[] = [];

  @Output() closeManual = new EventEmitter<void>();

  constructor(private sanitizer: DomSanitizer) {
    this.filteredSections = [...this.manualSections];
  }

  ngOnInit() {
    // Cargar secciones guardadas del localStorage
    const savedBookmarks = localStorage.getItem('rpeManualBookmarks');
    if (savedBookmarks) {
      this.bookmarkedSections = JSON.parse(savedBookmarks);
    }
  }

  manualSections: ManualSection[] = [
    {
      title: "Introducción",
      subtitle: "Bienvenido al Sistema RPE",
      content: [
        "El <strong>Registro Poblacional de Epilepsia (RPE)</strong> es una herramienta integral diseñada para el seguimiento, gestión y análisis de pacientes con epilepsia.",
        "Este sistema permite a los profesionales de la salud registrar, monitorear y analizar datos clínicos de manera segura y eficiente, garantizando la trazabilidad y confidencialidad de la información.",
        "El manual proporciona guías completas para el uso de todas las funcionalidades del sistema, organizadas por roles de usuario y módulos específicos."
      ],
      videoUrl: "https://www.youtube.com/embed/-EhGpD57jI0",
      tips: [
        "Utiliza el <strong>buscador</strong> para encontrar rápidamente temas específicos.",
        "Puedes navegar entre secciones con las <strong>flechas del teclado (← →)</strong>.",
        "Guarda las secciones más importantes usando el botón de <strong>marcador</strong>."
      ],
      importantNotes: [
        "Todos los datos ingresados en el sistema están protegidos por las <strong>normas de confidencialidad médica</strong>.",
        "Es responsabilidad del usuario <strong>mantener sus credenciales de acceso seguras</strong>.",
        "El sistema registra todas las acciones realizadas para fines de <strong>auditoría y trazabilidad</strong>."
      ],
      icon: "home"
    },
    {
      title: "Registro de Usuarios, Capas y Variables",
      subtitle: "Solicitudes de creación en el sistema",
      content: [
        "Antes de acceder al sistema, los usuarios deben realizar una <strong>solicitud formal</strong> para registrarse como Usuario, o bien para registrar una nueva Capa de investigación o Variable clínica.",
        "Estas solicitudes se hacen a través del módulo de <strong>'Registro en el Sistema'</strong>, accesible desde la página principal.",
        "El formulario correspondiente debe ser llenado con <strong>datos válidos y completos</strong>, incluyendo nombre completo, identificación, correo electrónico y motivo de la solicitud.",
        "Por motivos de seguridad, todas las solicitudes son <strong>revisadas manualmente</strong> por el equipo administrador antes de ser aprobadas."
      ],
      subtitle2: "Tipos de registro disponibles",
      content2: [
        "<strong>Registro de Usuario</strong>: Para profesionales de salud o investigadores que deseen usar el sistema.",
        "<strong>Registro de Capa</strong>: Para crear una nueva línea de investigación o grupo de estudio.",
        "<strong>Registro de Variable</strong>: Para solicitar una nueva variable clínica no existente en el sistema."
      ],
      helpImage: "../../assets/manual/registro.png",
      imageCaption: "Figura 1. Módulo de solicitud de registro en el sistema",
      tips: [
        "Verifica tus datos antes de enviar la solicitud.",
        "Explica claramente el propósito si estás solicitando una nueva capa o variable.",
        "Mantén tu información de contacto actualizada para recibir notificaciones."
      ],
      importantNotes: [
        "La creación de capas y variables está sujeta a aprobación por parte del administrador.",
        "Solo usuarios autorizados pueden solicitar nuevas variables.",
        "El tiempo de respuesta puede variar según la complejidad de la solicitud."
      ],
      referenceTable: {
        title: "Tipos de Registro Disponibles",
        headers: ["Tipo", "Propósito", "Requisitos", "Tiempo de Respuesta"],
        rows: [
          ["Usuario", "Acceso al sistema", "Credenciales válidas", "24-48 horas"],
          ["Capa", "Nueva línea de investigación", "Justificación aprobada", "3-5 días"],
          ["Variable", "Nueva variable clínica", "Validación técnica", "5-7 días"]
        ]
      },
      icon: "person_add"
    },
    {
      title: "Administración del Sistema",
      subtitle: "Gestión de usuarios, capas y variables",
      content: [
        "Los usuarios con rol de <strong>Superadministrador</strong> tienen acceso completo al módulo de administración del sistema.",
        "Desde este módulo se pueden realizar todas las operaciones de gestión de usuarios, capas, variables y registros del sistema.",
        "Para acceder al panel de administración, selecciona la opción <strong>'Administración'</strong> en el menú principal del sistema."
      ],
      subtitle2: "Funciones principales del administrador",
      content2: [
        "<strong>Gestión de Usuarios</strong>: Crear, editar, eliminar y desactivar usuarios del sistema.",
        "<strong>Gestión de Capas</strong>: Aprobar, modificar y eliminar capas de investigación.",
        "<strong>Gestión de Variables</strong>: Administrar el catálogo completo de variables clínicas.",
        "<strong>Auditoría</strong>: Revisar logs de actividad y cambios en el sistema.",
        "<strong>Configuración</strong>: Ajustar parámetros generales del sistema."
      ],
      helpImage: "../../assets/manual/admin.png",
      imageCaption: "Figura 2. Panel de administración del sistema",
      tips: [
        "Realiza copias de seguridad periódicas de la base de datos.",
        "Mantén un registro de todos los cambios realizados en el sistema.",
        "Revisa regularmente los logs de actividad para detectar anomalías."
      ],
      importantNotes: [
        "Las eliminaciones de usuarios y capas son <strong>permanentes</strong> y requieren confirmación.",
        "Los cambios en variables pueden afectar datos existentes.",
        "Solo usuarios con rol de Superadministrador pueden acceder a todas las funciones."
      ],
      referenceTable: {
        title: "Funciones de Administración por Rol",
        headers: ["Función", "Superadministrador", "Administrador", "Usuario Regular"],
        rows: [
          ["Gestión de Usuarios", "Completa", "Limitada", "No disponible"],
          ["Gestión de Capas", "Completa", "Limitada", "Solo lectura"],
          ["Gestión de Variables", "Completa", "Limitada", "Solo lectura"],
          ["Auditoría", "Completa", "Parcial", "No disponible"],
          ["Configuración", "Completa", "Parcial", "No disponible"]
        ]
      },
      icon: "admin_panel_settings"
    },
    {
      title: "Gestión de Pacientes",
      subtitle: "Registro y seguimiento de pacientes",
      content: [
        "El módulo de <strong>Gestión de Pacientes</strong> permite registrar y dar seguimiento a todos los pacientes incluidos en el sistema.",
        "Para acceder a este módulo, selecciona la opción <strong>'Pacientes'</strong> en el menú principal.",
        "Desde aquí puedes realizar búsquedas, crear nuevos registros, editar información existente y visualizar el historial completo de cada paciente."
      ],
      subtitle2: "Proceso de registro de pacientes",
      content2: [
        "<strong>Nuevo Paciente</strong>: Si el paciente no existe en ninguna capa, puedes crear un registro completamente nuevo.",
        "<strong>Paciente Existente</strong>: Si el paciente ya está registrado en otra capa, puedes acceder a su información existente.",
        "<strong>Registro en Mi Capa</strong>: Si el paciente existe pero no en tu capa, puedes agregarlo a tu capa manteniendo el historial centralizado."
      ],
      helpImage: "../../assets/manual/pacientes.png",
      imageCaption: "Figura 3. Módulo de gestión de pacientes",
      tips: [
        "Verifica siempre si un paciente ya existe antes de crear un nuevo registro.",
        "Utiliza los filtros avanzados para encontrar pacientes específicos.",
        "Mantén la información de contacto del paciente actualizada."
      ],
      importantNotes: [
        "La información de pacientes es <strong>confidencial</strong> y solo accesible para usuarios autorizados.",
        "Los cambios en registros de pacientes quedan registrados en el log de auditoría.",
        "La eliminación de pacientes requiere autorización de superadministrador."
      ],
      icon: "personal_injury"
    },
    {
      title: "Consentimientos Informados",
      subtitle: "Creación y firma de documentos",
      content: [
        "El módulo de <strong>Consentimientos Informados</strong> permite gestionar todo el proceso de consentimiento de los pacientes.",
        "Para acceder a este módulo, selecciona la opción <strong>'Consentimientos'</strong> en el menú principal o desde el perfil del paciente.",
        "El sistema incluye plantillas predefinidas que pueden ser personalizadas según las necesidades específicas de cada estudio o tratamiento."
      ],
      subtitle2: "Flujo de trabajo de consentimientos",
      content2: [
        "<strong>Creación</strong>: Seleccionar plantilla y personalizar contenido según necesidades.",
        "<strong>Revisión</strong>: El paciente recibe y revisa el documento con el profesional de salud.",
        "<strong>Firma</strong>: El paciente firma electrónicamente el documento.",
        "<strong>Almacenamiento</strong>: El documento firmado se almacena de forma segura en el sistema.",
        "<strong>Seguimiento</strong>: Monitoreo de vencimientos y renovaciones necesarias."
      ],
      helpImage: "../../assets/manual/consentimientos.png",
      imageCaption: "Figura 4. Proceso de consentimiento informado",
      tips: [
        "Explica claramente cada sección del consentimiento al paciente.",
        "Asegúrate de que el paciente comprenda completamente antes de firmar.",
        "Programa recordatorios para consentimientos próximos a vencer."
      ],
      importantNotes: [
        "Los consentimientos informados son <strong>documentos legales</strong>.",
        "Es obligatorio obtener consentimiento antes de cualquier procedimiento.",
        "Los documentos firmados no pueden ser modificados posteriormente."
      ],
      referenceTable: {
        title: "Tipos de Consentimiento Disponibles",
        headers: ["Tipo", "Propósito", "Vigencia", "Requisitos"],
        rows: [
          ["Tratamiento", "Autorización de procedimientos", "Indefinida", "Explicación completa"],
          ["Investigación", "Participación en estudios", "Duración del estudio", "Aprobación comité ético"],
          ["Imágenes", "Uso de material visual", "Específica", "Propósito definido"],
          ["Datos", "Procesamiento de información", "Indefinida", "Política de privacidad"]
        ]
      },
      icon: "assignment"
    },
    {
      title: "Análisis con Superset",
      subtitle: "Creación de dashboards y reportes",
      content: [
        "El sistema integra <strong>Apache Superset</strong> para el análisis avanzado y visualización de datos.",
        "Para acceder a Superset, selecciona la opción <strong>'Análisis'</strong> en el menú principal.",
        "Esta herramienta permite crear dashboards interactivos, reportes detallados y análisis estadísticos sin necesidad de conocimientos técnicos avanzados."
      ],
      subtitle2: "Funcionalidades principales",
      content2: [
        "<strong>Visualizaciones</strong>: Crear gráficos, tablas y mapas interactivos.",
        "<strong>Dashboards</strong>: Combinar múltiples visualizaciones en paneles unificados.",
        "<strong>SQL Lab</strong>: Ejecutar consultas SQL avanzadas para análisis personalizados.",
        "<strong>Reportes Programados</strong>: Configurar envío automático de reportes por correo.",
        "<strong>Análisis Exploratorio</strong>: Descubrir patrones y tendencias en los datos."
      ],
      helpImage: "../../assets/manual/superset.png",
      imageCaption: "Figura 5. Interfaz de Apache Superset",
      tips: [
        "Comienza con las plantillas predefinidas para familiarizarte con la herramienta.",
        "Utiliza filtros para segmentar los datos según tus necesidades.",
        "Comparte dashboards con colegas para colaboración en análisis."
      ],
      importantNotes: [
        "El acceso a datos está restringido según los permisos de usuario.",
        "Los cambios en visualizaciones no afectan los datos originales.",
        "Es recomendable guardar frecuentemente el trabajo en progreso."
      ],
      referenceTable: {
        title: "Tipos de Visualización Disponibles",
        headers: ["Tipo", "Uso Recomendado", "Ventajas", "Limitaciones"],
        rows: [
          ["Tabla", "Datos detallados", "Precisión numérica", "Visualmente simple"],
          ["Gráfico de Barras", "Comparaciones", "Fácil interpretación", "Límite de categorías"],
          ["Líneas de Tiempo", "Tendencias", "Evolución temporal", "Requiere datos secuenciales"],
          ["Mapa", "Datos geográficos", "Contexto espacial", "Requiere coordenadas"],
          ["Gráfico Circular", "Proporciones", "Visual atractivo", "Dificultad con muchas categorías"]
        ]
      },
      icon: "analytics"
    },
    {
      title: "Seguridad y Privacidad",
      subtitle: "Protección de datos y cumplimiento normativo",
      content: [
        "El sistema RPE implementa <strong>múltiples capas de seguridad</strong> para garantizar la protección de la información sensible de los pacientes.",
        "Todas las comunicaciones están <strong>encriptadas</strong> utilizando protocolos de seguridad avanzados.",
        "El acceso a los datos está controlado mediante un sistema de <strong>autenticación robusto</strong> y <strong>autorizaciones granulares</strong>."
      ],
      subtitle2: "Medidas de seguridad implementadas",
      content2: [
        "<strong>Autenticación Multifactor</strong>: Opcional para mayor seguridad en el acceso.",
        "<strong>Encriptación de Datos</strong>: Tanto en tránsito como en reposo.",
        "<strong>Control de Acceso Basado en Roles (RBAC)</strong>: Permisos específicos por tipo de usuario.",
        "<strong>Auditoría Completa</strong>: Registro de todas las acciones realizadas en el sistema.",
        "<strong>Copias de Seguridad</strong>: Programadas automáticamente y almacenadas de forma segura."
      ],
      tips: [
        "Cambia tu contraseña regularmente y no la compartas.",
        "Cierra sesión cuando termines de usar el sistema, especialmente en computadoras compartidas.",
        "Reporta inmediatamente cualquier actividad sospechosa al administrador."
      ],
      importantNotes: [
        "El sistema cumple con las <strong>normativas de protección de datos</strong> aplicables.",
        "El acceso no autorizado a datos médicos constituye una <strong>infracción grave</strong>.",
        "Todos los usuarios son responsables de mantener la confidencialidad de sus credenciales."
      ],
      referenceTable: {
        title: "Niveles de Acceso por Rol",
        headers: ["Recurso", "Superadministrador", "Médico", "Investigador", "Paciente"],
        rows: [
          ["Datos Personales", "Completo", "Limitado a pacientes", "Anonimizado", "Propios"],
          ["Historial Clínico", "Completo", "Completo a pacientes", "Anonimizado", "Propio"],
          ["Análisis Superset", "Completo", "Limitado", "Completo", "No disponible"],
          ["Configuración Sistema", "Completo", "No disponible", "No disponible", "No disponible"]
        ]
      },
      icon: "security"
    },
    {
      title: "Soporte y Resolución de Problemas",
      subtitle: "Asistencia técnica y recursos de ayuda",
      content: [
        "El sistema cuenta con <strong>múltiples canales de soporte</strong> para asistir a los usuarios en caso de dudas o problemas técnicos.",
        "Antes de contactar al soporte, revisa este manual y las <strong>Preguntas Frecuentes (FAQ)</strong> disponibles en el sistema.",
        "Para reportar un problema, proporciona la mayor cantidad de información posible: descripción detallada, pasos para reproducir el error, capturas de pantalla y datos de tu sistema."
      ],
      subtitle2: "Canales de soporte disponibles",
      content2: [
        "<strong>Manual de Usuario</strong>: Este documento completo con guías paso a paso.",
        "<strong>FAQ del Sistema</strong>: Respuestas a las preguntas más comunes.",
        "<strong>Soporte por Correo</strong>: Para consultas técnicas y reporte de errores.",
        "<strong>Asistencia Remota</strong>: Sesiones en línea para resolver problemas complejos.",
        "<strong>Capacitaciones</strong>: Sesiones grupales e individuales programadas regularmente."
      ],
      tips: [
        "Reinicia tu navegador si experimentas problemas de rendimiento.",
        "Verifica tu conexión a internet antes de reportar problemas de acceso.",
        "Mantén tu navegador actualizado para mejor compatibilidad."
      ],
      importantNotes: [
        "El soporte técnico está disponible en <strong>horario laboral</strong> de lunes a viernes.",
        "Los problemas críticos que afecten la atención de pacientes tienen <strong>prioridad máxima</strong>.",
        "Todas las solicitudes de soporte son registradas y seguidas hasta su resolución."
      ],
      referenceTable: {
        title: "Tiempos de Respuesta de Soporte",
        headers: ["Tipo de Problema", "Prioridad", "Tiempo Respuesta Inicial", "Tiempo Resolución Estimado"],
        rows: [
          ["Crítico (sistema no funciona)", "Alta", "1 hora", "4 horas"],
          ["Funcionalidad limitada", "Media", "4 horas", "24 horas"],
          ["Consulta de uso", "Baja", "24 horas", "72 horas"],
          ["Nueva funcionalidad", "Baja", "72 horas", "Evaluación requerida"]
        ]
      },
      icon: "help"
    }
  ];

  // Método para navegar a una sección específica
  goToSection(index: number): void {
    this.currentSection = index;
    this.showSearchResults = false;
  }

  // Método para navegar a la sección anterior
  prevSection(): void {
    if (this.currentSection > 0) {
      this.currentSection--;
    }
  }

  // Método para navegar a la siguiente sección
  nextSection(): void {
    if (this.currentSection < this.manualSections.length - 1) {
      this.currentSection++;
    }
  }

  // Método para cerrar el modal
  closeModal(): void {
    this.isModalOpen = false;
    setTimeout(() => {
      this.closeManual.emit();
    }, 300);
  }

  // Método para buscar en el manual
  searchManual(event: any): void {
    this.searchTerm = event.target.value.toLowerCase().trim();
    
    if (!this.searchTerm) {
      this.filteredSections = [...this.manualSections];
      this.showSearchResults = false;
      return;
    }

    this.filteredSections = this.manualSections.filter(section => {
      // Buscar en título y subtítulo
      if (section.title.toLowerCase().includes(this.searchTerm) || 
          section.subtitle.toLowerCase().includes(this.searchTerm)) {
        return true;
      }
      
      // Buscar en contenido
      if (section.content.some(paragraph => 
          paragraph.toLowerCase().includes(this.searchTerm))) {
        return true;
      }
      
      // Buscar en contenido adicional
      if (section.content2 && section.content2.some(paragraph => 
          paragraph.toLowerCase().includes(this.searchTerm))) {
        return true;
      }
      
      // Buscar en tips
      if (section.tips && section.tips.some(tip => 
          tip.toLowerCase().includes(this.searchTerm))) {
        return true;
      }
      
      // Buscar en notas importantes
      if (section.importantNotes && section.importantNotes.some(note => 
          note.toLowerCase().includes(this.searchTerm))) {
        return true;
      }
      
      return false;
    });

    this.searchResultsCount = this.filteredSections.length;
    this.showSearchResults = true;
    
    if (this.filteredSections.length > 0) {
      this.currentSection = this.manualSections.indexOf(this.filteredSections[0]);
    }
  }

  // Método para limpiar la búsqueda
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredSections = [...this.manualSections];
    this.showSearchResults = false;
    const searchInput = document.getElementById('manualSearch') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
  }

  // Método para resaltar texto en los resultados de búsqueda
  highlightText(text: string): string {
    if (!this.searchTerm || !this.showSearchResults) {
      return text;
    }
    
    const regex = new RegExp(`(${this.searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  }

  // Método para imprimir la sección actual
  printSection(): void {
    window.print();
  }

  // Método para guardar/eliminar marcador
  toggleBookmark(sectionIndex: number): void {
    const index = this.bookmarkedSections.indexOf(sectionIndex);
    
    if (index === -1) {
      this.bookmarkedSections.push(sectionIndex);
    } else {
      this.bookmarkedSections.splice(index, 1);
    }
    
    // Guardar en localStorage
    localStorage.setItem('rpeManualBookmarks', JSON.stringify(this.bookmarkedSections));
  }

  // Método para verificar si una sección está marcada
  isBookmarked(sectionIndex: number): boolean {
    return this.bookmarkedSections.includes(sectionIndex);
  }

  // Manejo de teclado para navegación
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isModalOpen) return;
    
    switch(event.key) {
      case 'ArrowLeft':
        this.prevSection();
        break;
      case 'ArrowRight':
        this.nextSection();
        break;
      case 'Escape':
        this.closeModal();
        break;
    }
  }
}