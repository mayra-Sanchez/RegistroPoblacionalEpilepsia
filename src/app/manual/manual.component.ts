import { Component, EventEmitter, Output, HostListener } from '@angular/core';
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
  tips?: string[]; // Nuevo campo para consejos prácticos
  importantNotes?: string[]; // Nuevo campo para notas importantes
}

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.css']
})
export class ManualComponent {
  currentSection = 0;
  isModalOpen = true;
  filteredSections: ManualSection[];
  searchTerm = '';
  showSearchResults = false; // Control para mostrar/ocultar resultados de búsqueda
  searchResultsCount = 0; // Contador de resultados de búsqueda

  @Output() closeManual = new EventEmitter<void>();

  constructor(private sanitizer: DomSanitizer) {
    this.filteredSections = [...this.manualSections];
  }

  manualSections: ManualSection[] = [
    {
      title: "Introducción",
      subtitle: "Bienvenido al Sistema RPE",
      content: [
        "El Registro Poblacional de Epilepsia (RPE) es una herramienta diseñada para el seguimiento y gestión de pacientes con epilepsia.",
        "Este sistema permite a los profesionales de la salud registrar, monitorear y analizar datos clínicos de manera segura y eficiente.",
        "El manual proporciona guías completas para el uso de todas las funcionalidades del sistema."
      ],
      videoUrl: "https://www.youtube.com/embed/ejemplo_intro",
      tips: [
        "Utiliza el buscador para encontrar rápidamente temas específicos.",
        "Puedes navegar entre secciones con las flechas del teclado (← →)."
      ],
      importantNotes: [
        "Todos los datos ingresados en el sistema están protegidos por las normas de confidencialidad médica.",
        "Es responsabilidad del usuario mantener sus credenciales de acceso seguras."
      ]
    },
    {
      title: "Registro de Usuarios, Capas y Variables",
      subtitle: "Solicitudes de creación en el sistema",
      content: [
        "Antes de acceder al sistema, los usuarios deben realizar una solicitud formal para registrarse como Usuario, o bien para registrar una nueva Capa de investigación o Variable clínica.",
        "Estas solicitudes se hacen a través del módulo de 'Registro en el Sistema', accesible desde la página principal.",
        "El formulario correspondiente debe ser llenado con datos válidos, incluyendo nombre completo, identificación, correo electrónico y motivo de la solicitud.",
        "Por motivos de seguridad, todas las solicitudes son revisadas manualmente por el equipo administrador antes de ser aprobadas."
      ],
      subtitle2: "Tipos de registro disponibles",
      content2: [
        "- **Registro de Usuario**: Para profesionales de salud o investigadores que deseen usar el sistema.",
        "- **Registro de Capa**: Para crear una nueva línea de investigación o grupo de estudio.",
        "- **Registro de Variable**: Para solicitar una nueva variable clínica no existente en el sistema."
      ],
      helpImage: "../../assets/manual/registro.png", 
      imageCaption: "Figura 5. Módulo de solicitud de registro en el sistema",
      tips: [
        "Verifica tus datos antes de enviar la solicitud.",
        "Explica claramente el propósito si estás solicitando una nueva capa o variable."
      ],
      importantNotes: [
        "La creación de capas y variables está sujeta a aprobación por parte del administrador.",
        "Recibirás una notificación por correo cuando tu solicitud haya sido aprobada o rechazada."
      ]
    }
    ,
    {
      title: "Inicio de Sesión y Acceso",
      subtitle: "Autenticación y control de usuarios",
      content: [
        "Todos los usuarios deben iniciar sesión con sus credenciales personales. Esto garantiza que cada acción realizada quede registrada y sea segura.",
        "Los roles disponibles son: Administrador, Profesional de la Salud e Investigador. Cada uno accede a diferentes módulos y funcionalidades.",
        "Después de 15 minutos de inactividad, el sistema cierra sesión automáticamente por seguridad.",
        "En caso de olvidar la contraseña, se puede solicitar un enlace de recuperación al correo electrónico registrado."
      ],
      videoUrl: "https://www.youtube.com/embed/ejemplo_login",
      tips: [
        "Utiliza contraseñas seguras con letras, números y símbolos.",
        "No compartas tu usuario con otros miembros del equipo."
      ],
      importantNotes: [
        "El acceso está basado en roles. Asegúrate de tener los permisos correctos antes de realizar acciones críticas.",
        "El sistema registra el historial de accesos y acciones para auditoría."
      ]
    },
    {
      title: "Rol Administrador",
      subtitle: "Gestión del Sistema RPE",
      content: [
        "El rol de administrador permite gestionar usuarios, variables y capas de investigación.",
        "Accede al panel de administración para:",
        "- Crear y gestionar usuarios del sistema",
        "- Definir variables clínicas y parámetros del sistema",
        "- Configurar permisos y roles de acceso",
        "- Monitorear estadísticas de uso del sistema",
        "- Exportar datos para respaldos o análisis externos"
      ],
      subtitle2: "Funciones Avanzadas",
      content2: [
        "Auditoría del sistema: revisión de logs de acceso y cambios.",
        "Configuración de alertas y notificaciones automáticas.",
        "Gestión de capas de investigación y permisos asociados."
      ],
      videoUrl: "https://www.youtube.com/embed/admin_demo",
      helpImage: "../../assets/manual/administrador.png",
      imageCaption: "Figura 1. Vista del panel de administración",
      tips: [
        "Realiza respaldos periódicos de la información del sistema.",
        "Asigna permisos con el principio de mínimo privilegio necesario."
      ],
      importantNotes: [
        "El administrador tiene acceso a toda la información del sistema.",
        "Los cambios en la configuración pueden afectar el funcionamiento global del sistema."
      ]
    },
    {
      title: "Gestión de Capas de Investigación",
      subtitle: "Administración de grupos de análisis",
      content: [
        "Las capas permiten separar los datos según grupos de investigación.",
        "Cada capa tiene un nombre, descripción y un jefe de capa.",
        "Los investigadores acceden únicamente a los datos de su capa asignada."
      ],
      subtitle2: "Permisos y seguridad",
      content2: [
        "Los usuarios deben ser autorizados por el administrador para acceder a una capa.",
        "Cada acción queda registrada para fines de auditoría."
      ],
      tips: [
        "Nombrar claramente las capas facilita su uso futuro.",
        "No otorgues acceso a capas sensibles sin aprobación ética."
      ],
      importantNotes: [
        "La eliminación de una capa es irreversible.",
        "Toda capa debe tener variables asociadas antes de estar activa."
      ]
    },
    {
      title: "Gestión de Variables Clínicas",
      subtitle: "Creación y edición de variables",
      content: [
        "Las variables son campos personalizados que describen características clínicas de los pacientes.",
        "Cada variable tiene un tipo de dato (texto, número, lista, fecha) y se asocia a una capa específica.",
        "Estas variables se usan en los formularios de registro clínico."
      ],
      subtitle2: "Configuración y consistencia",
      content2: [
        "Evita duplicados. Usa nombres claros y descripciones.",
        "Una mala configuración puede afectar la calidad de los datos clínicos."
      ],
      tips: [
        "Agrupa variables similares usando prefijos o categorías.",
        "Antes de eliminar variables, asegúrate de que no están en uso."
      ],
      importantNotes: [
        "Las variables clínicas solo pueden ser editadas por el administrador.",
        "Si una variable ya fue usada en un registro, no puede eliminarse."
      ]
    },
    {
      title: "Registro de Pacientes",
      subtitle: "Formulario clínico y episodios",
      content: [
        "Los profesionales de la salud registran datos básicos del paciente, su cuidador y el personal de salud responsable.",
        "Además de los datos demográficos, se registran los antecedentes médicos y los episodios clínicos.",
        "Cada paciente se asocia a una capa básica y una capa de investigación.",
        "El sistema guarda automáticamente la trazabilidad: usuario que registró, fecha y hora."
      ],
      subtitle2: "Registro clínico por capas",
      content2: [
        "Cada capa de investigación incluye variables clínicas definidas por el administrador.",
        "Los campos se generan dinámicamente según las variables configuradas.",
        "Solo los usuarios autorizados pueden registrar en determinadas capas."
      ],
      helpImage: "assets/images/register-form.png",
      imageCaption: "Figura 2. Formulario de ingreso de paciente",
      tips: [
        "Verifica que todos los datos estén completos antes de guardar.",
        "Usa la función de autocompletado para evitar duplicados."
      ],
      importantNotes: [
        "Una vez creado el paciente, no puede eliminarse.",
        "Solo se pueden editar registros clínicos si se tiene el permiso correspondiente."
      ]
    },
    {
      title: "Rol Doctor o Personal de Salud",
      subtitle: "Atención y registro de pacientes",
      content: [
        "Este rol está diseñado para registrar y monitorear datos clínicos de pacientes con epilepsia.",
        "Funcionalidades principales:",
        "- Registro de nuevos pacientes",
        "- Actualización de historias clínicas",
        "- Programación de citas y seguimientos",
        "- Generación de reportes clínicos",
        "- Visualización de historial médico completo"
      ],
      subtitle2: "Procedimientos clínicos",
      content2: [
        "Cómo registrar un nuevo episodio epiléptico",
        "Cómo actualizar el tratamiento médico",
        "Cómo generar certificados médicos",
        "Cómo exportar datos para referencias"
      ],
      videoUrl: "https://www.youtube.com/embed/doctor_demo",
      helpImage: "../../assets/manual/doctor.png",
      imageCaption: "Figura 3. Formulario de registro clínico",
      tips: [
        "Utiliza plantillas predefinidas para agilizar el registro de casos comunes.",
        "Puedes agregar notas rápidas con atajos de teclado."
      ],
      importantNotes: [
        "Verifica siempre la identidad del paciente antes de actualizar registros.",
        "Los campos marcados con (*) son obligatorios para el registro."
      ]
    },
    {
      title: "Rol Investigador",
      subtitle: "Análisis e investigación",
      content: [
        "El rol de investigador permite analizar datos y gestionar capas de investigación.",
        "Funcionalidades disponibles:",
        "- Acceso a datos clínicos según capa de investigación autorizada",
        "- Herramientas de análisis estadístico integradas",
        "- Generación de gráficos y reportes personalizados",
        "- Exportación de datos para análisis avanzados (CSV, Excel)",
        "- Filtrado avanzado de casos por múltiples variables"
      ],
      subtitle2: "Protocolos de investigación",
      content2: [
        "Cómo diseñar un estudio dentro del sistema",
        "Cómo solicitar acceso a datos adicionales",
        "Cómo exportar datos cumpliendo con protocolos de anonimización",
        "Cómo colaborar con otros investigadores"
      ],
      videoUrl: "https://www.youtube.com/embed/researcher_demo",
      helpImage: "../../assets/manual/investigador.png",
      imageCaption: "Figura 4. Panel de análisis de investigación",
      tips: [
        "Guarda tus consultas frecuentes para reutilizarlas luego.",
        "Utiliza los filtros temporales para analizar tendencias."
      ],
      importantNotes: [
        "El acceso a datos está restringido según los protocolos de ética aprobados.",
        "Todos los análisis exportados deben cumplir con políticas de privacidad de datos."
      ]
    },
    {
      title: "Visualización de Datos con Superset",
      subtitle: "Dashboards clínicos y exportación",
      content: [
        "El sistema se integra con Apache Superset para mostrar dashboards con datos anonimizados.",
        "Los investigadores pueden aplicar filtros para obtener estadísticas específicas.",
        "Los gráficos se actualizan automáticamente con los filtros aplicados."
      ],
      subtitle2: "Exportación de datos",
      content2: [
        "Puedes exportar visualizaciones a PDF, PNG o Excel.",
        "Los datos exportados deben cumplir con las normas éticas y de anonimización."
      ],
      tips: [
        "Agrupa filtros por variable para generar reportes más precisos.",
        "Revisa bien los dashboards antes de compartirlos externamente."
      ],
      importantNotes: [
        "Superset solo muestra los datos disponibles según la capa del usuario.",
        "Las visualizaciones deben respetar la privacidad del paciente."
      ]
    },
    {
      title: "Consentimiento y Ética",
      subtitle: "Normas legales y uso responsable",
      content: [
        "El sistema cumple con la Ley 1581 de 2012 de protección de datos personales en Colombia.",
        "El uso de datos está limitado a los fines autorizados por el comité de ética.",
        "Todo paciente debe firmar un consentimiento informado antes de su inclusión."
      ],
      subtitle2: "Responsabilidad del usuario",
      content2: [
        "El uso indebido de datos clínicos puede generar sanciones legales.",
        "Toda acción en el sistema queda registrada para auditoría."
      ],
      tips: [
        "Informa a tus pacientes sobre cómo se usarán sus datos.",
        "Nunca exportes ni compartas datos sin autorización oficial."
      ],
      importantNotes: [
        "Los investigadores deben cumplir con los protocolos de ética institucional.",
        "Toda investigación debe estar registrada y aprobada."
      ]
    },
    {
      title: "Soporte Técnico",
      subtitle: "Cómo obtener ayuda",
      content: [
        "Para asistencia técnica, contacte a nuestro equipo de soporte:",
        "📧 Email: soporte.registroepilepsia@gmail.com",
        "📞 Teléfono: +57 3026929375",
        "🕒 Horario: Lunes a Viernes de 8:00 a.m. a 5:00 p.m.",
        "",
        "Antes de contactar al soporte, tenga a mano:",
        "- La versión del sistema (visible en el pie de página)",
        "- El navegador que está utilizando",
        "- Una descripción detallada del problema",
        "- Capturas de pantalla del error (si aplica)"
      ],
      subtitle2: "Preguntas frecuentes",
      content2: [
        "Q: ¿Cómo restablezco mi contraseña?",
        "R: Utiliza el enlace 'Olvidé mi contraseña' en la página de login.",
        "",
        "Q: ¿El sistema está disponible en móviles?",
        "R: Sí, el sistema es responsive aunque algunas funciones avanzadas requieren pantalla grande.",
        "",
        "Q: ¿Con qué frecuencia se actualiza el sistema?",
        "R: Se aplican mejoras mensualmente con nuevas funcionalidades y correcciones."
      ],
      tips: [
        "Consulta esta sección antes de llamar o enviar un correo.",
        "Proporciona información detallada para acelerar el soporte."
      ]
    },
    {
      title: "Glosario",
      subtitle: "Términos clave del sistema",
      content: [
        "- **Administrador**: Usuario con control total sobre el sistema. Puede crear usuarios, capas, variables, y configurar permisos.",
        "- **Autenticación**: Proceso de verificación de identidad mediante usuario y contraseña.",
        "- **Auditoría**: Registro de todas las acciones realizadas en el sistema (quién, cuándo, qué).",
        "- **Capa de investigación**: Conjunto de datos clínicos segmentados por un criterio de investigación. Solo accesibles por usuarios autorizados.",
        "- **Consentimiento informado**: Documento firmado por el paciente que autoriza el uso de sus datos para fines clínicos o de investigación.",
        "- **CSV/Excel**: Formatos comunes de exportación de datos para análisis fuera del sistema.",
        "- **Dashboards**: Paneles gráficos que muestran visualizaciones de datos en tiempo real (implementados con Superset).",
        "- **Doctor / Profesional de la Salud**: Usuario autorizado para registrar pacientes y actualizar historias clínicas.",
        "- **Episodio epiléptico**: Evento clínico registrado por el personal médico, que forma parte del historial del paciente.",
        "- **Filtro avanzado**: Herramienta que permite segmentar los datos por edad, género, capa, variables clínicas, entre otros.",
        "- **Glosario**: Sección del manual donde se explican los términos técnicos utilizados en el sistema.",
        "- **Investigador**: Usuario con permisos para consultar y analizar los datos clínicos de una capa de investigación.",
        "- **MongoDB**: Sistema de base de datos no relacional donde se almacenan todos los datos del sistema.",
        "- **Registro clínico**: Formulario digital que contiene la información médica de un paciente.",
        "- **RPE**: Abreviatura de “Registro Poblacional de Epilepsia”, nombre del sistema de información.",
        "- **Superset**: Herramienta de visualización de datos integrada al sistema para análisis estadístico e investigación.",
        "- **Trazabilidad**: Capacidad del sistema de registrar quién hizo qué acción, cuándo y en qué módulo.",
        "- **Usuario**: Persona registrada que accede al sistema con un rol asignado (administrador, doctor, investigador).",
        "- **Variable clínica**: Campo definido por el administrador para recolectar datos médicos específicos.",
        "- **Visualización de datos**: Representación gráfica de información médica para facilitar la interpretación."
      ],
      tips: [
        "Este glosario se actualiza a medida que se incorporan nuevas funcionalidades.",
        "Si tienes dudas sobre un término, consulta esta sección antes de contactar soporte."
      ]
    }

  ];



  searchManual(event: any) {
    this.searchTerm = event.target.value.toLowerCase().trim();

    if (this.searchTerm === '') {
      this.filteredSections = [...this.manualSections];
      this.showSearchResults = false;
      return;
    }

    this.filteredSections = this.manualSections.filter(section =>
      section.title.toLowerCase().includes(this.searchTerm) ||
      section.subtitle.toLowerCase().includes(this.searchTerm) ||
      (section.subtitle2 && section.subtitle2.toLowerCase().includes(this.searchTerm)) ||
      section.content.some(p => p.toLowerCase().includes(this.searchTerm)) ||
      (section.content2 && section.content2.some(p => p.toLowerCase().includes(this.searchTerm))) ||
      (section.tips && section.tips.some(p => p.toLowerCase().includes(this.searchTerm))) ||
      (section.importantNotes && section.importantNotes.some(p => p.toLowerCase().includes(this.searchTerm))));

    this.searchResultsCount = this.filteredSections.length;
    this.showSearchResults = true;

    if (this.filteredSections.length > 0) {
      this.currentSection = this.manualSections.indexOf(this.filteredSections[0]);
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredSections = [...this.manualSections];
    this.showSearchResults = false;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isModalOpen) return;

    if (event.key === 'ArrowLeft') {
      this.prevSection();
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.nextSection();
      event.preventDefault();
    } else if (event.key === 'Escape') {
      this.closeModal();
      event.preventDefault();
    } else if (event.ctrlKey && event.key === 'f') {
      const searchInput = document.getElementById('manualSearch');
      if (searchInput) {
        searchInput.focus();
        event.preventDefault();
      }
    }
  }

  goToSection(index: number) {
    if (index >= 0 && index < this.manualSections.length) {
      this.currentSection = index;
      this.scrollToTop();
    }
  }

  prevSection() {
    if (this.currentSection > 0) {
      this.currentSection--;
      this.scrollToTop();
    } else {
      // Opcional: ciclo al final si llega al inicio
      this.currentSection = this.manualSections.length - 1;
      this.scrollToTop();
    }
  }

  nextSection() {
    if (this.currentSection < this.manualSections.length - 1) {
      this.currentSection++;
      this.scrollToTop();
    } else {
      // Opcional: ciclo al inicio si llega al final
      this.currentSection = 0;
      this.scrollToTop();
    }
  }

  private scrollToTop() {
    const pagesContainer = document.querySelector('.manual-content');
    if (pagesContainer) {
      pagesContainer.scrollTop = 0;
    }
  }

  printSection() {
    const printContent = document.getElementById('manual-print-section');
    const originalContents = document.body.innerHTML;

    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    } else {
      window.print();
    }
  }

  closeModal() {
    this.isModalOpen = false;
    setTimeout(() => this.closeManual.emit(), 300);
  }

  // Pipe para seguridad de URLs
  safe(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Nuevo método para resaltar texto en los resultados de búsqueda
  highlightText(text: string): string {
    if (!this.searchTerm || !text) return text;

    const pattern = new RegExp(`(${this.searchTerm})`, 'gi');
    return text.replace(pattern, '<span class="highlight">$1</span>');
  }
}