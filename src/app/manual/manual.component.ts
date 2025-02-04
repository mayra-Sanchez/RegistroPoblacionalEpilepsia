import { Component } from '@angular/core';

@Component({
  selector: 'app-manual',
  templateUrl: './manual.component.html',
  styleUrls: ['./manual.component.css']
})
export class ManualComponent {
  currentSection = 0;

  manualSections = [
    {
      title: "Introducción",
      subtitle: "Bienvenido al sistema de registro de pacientes con epilepsia",
      content: [
        "Este manual explica el uso del sistema de registro de pacientes con epilepsia.",
        "Dirigido a profesionales de la salud, administradores e investigadores, facilita la gestión de información médica y garantiza la seguridad de los datos."
      ]
    },
    {
      title: "Registro y acceso al sistema",
      subtitle: "Pasos para crear y acceder a una cuenta",
      content: [
        "1️⃣ Dirígete a la página de inicio.",
        "2️⃣ Llena el formulario y contacta al administrador para poder crear tu cuenta.",
        "3️⃣ Tus datos serán enviados a través del correo electrónico.",
        "4️⃣ Para iniciar sesión, ingresa tu correo y contraseña en la pantalla de inicio."
      ]
    },
    {
      title: "Registro de pacientes",
      subtitle: "Cómo registrar un paciente correctamente",
      content: [
        "Esto solo se puede realizar si eres personal de la salud:",
        "1️⃣ Selecciona 'Registrar Paciente' en el menú principal.",
        "2️⃣ Ingresa los datos personales, historial médico y consentimiento informado.",
        "3️⃣ Guarda el registro y verifica la información."
      ]
    },
    {
      title: "Gestión del consentimiento informado",
      subtitle: "Requisitos legales y seguridad del consentimiento",
      content: [
        "🔹 Antes de registrar información, el paciente debe firmar digitalmente.",
        "🔹 La firma se almacena para cumplir con normativas de protección de datos."
      ]
    },
    {
      title: "Búsqueda y consulta de datos",
      subtitle: "Cómo encontrar información específica",
      content: [
        "🔹 Usa filtros de búsqueda.",
        "🔹 Visualiza información detallada."
      ]
    },
    {
      title: "Seguridad y protección de datos",
      subtitle: "Políticas de seguridad implementadas",
      content: [
        "✅ Acceso restringido a usuarios autorizados.",
        "✅ Cifrado de datos para mayor seguridad.",
        "✅ Cumplimiento de normativas de protección de datos.",
        "✅ Solo datos clínicos y demográficos."
      ]
    },
    {
      title: "Solución de problemas",
      subtitle: "Errores comunes y cómo solucionarlos",
      content: [
        "🔹 No puedo iniciar sesión: Verifica tu correo y contraseña.",
        "🔹 No puedo registrar un paciente: Completa todos los campos requeridos.",
        "🔹 Error en la visualización: Recarga la página o contacta soporte."
      ],
      subtitle2: "Errores comunes y cómo solucionarlos",
      content2: [
        "🔹 No puedo iniciar sesión: Verifica tu correo y contraseña.",
        "🔹 No puedo registrar un paciente: Completa todos los campos requeridos.",
        "🔹 Error en la visualización: Recarga la página o contacta soporte."
      ]
    },
    {
      title: "Contacto y soporte técnico",
      subtitle: "Dónde encontrar ayuda",
      content: [
        "📧 Correo: soporte@epilepsia.com",
        "📞 Teléfono: +123 456 7890",
        "🌐 Web: www.epilepsia.com"
      ]
    }
  ];

  goToSection(index: number) {
    this.currentSection = index;
  }

  prevSection() {
    if (this.currentSection > 0) {
      this.currentSection--;
    }
  }

  nextSection() {
    if (this.currentSection < this.manualSections.length - 1) {
      this.currentSection++;
    }
  }
}

