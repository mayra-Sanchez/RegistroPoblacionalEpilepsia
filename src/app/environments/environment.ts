/**
 * CONFIGURACIÓN DE ENTORNO - ARCHIVO DE VARIABLES DE ENTORNO
 * ===========================================================
 * 
 * Archivo: environment.ts
 * Tipo: Configuración de entorno de desarrollo
 * Autor: [Mayra Sánchez]
 * Fecha: [29/09/2025]
 * Versión: 1.0
 * 
 * DESCRIPCIÓN:
 * Este archivo contiene las variables de configuración específicas para el entorno de desarrollo.
 * Define URLs base, endpoints de API y flags de entorno que son utilizados throughout la aplicación.
 * 
 * USO:
 * - Para desarrollo local: environment.ts
 * - Para producción: environment.prod.ts (debe contener valores diferentes)
 * 
 * IMPORTANTE:
 * - Nunca commitear credenciales sensibles en este archivo
 * - Validar que todas las URLs terminen sin '/' al final
 * - Mantener consistencia en la estructura entre environment.ts y environment.prod.ts
 */

export const environment = {
  
  /**
   * FLAG DE PRODUCCIÓN
   * ------------------
   * Indica si la aplicación se está ejecutando en modo producción.
   * 
   * Valores:
   * - false: Entorno de desarrollo (logging habilitado, features de debug)
   * - true: Entorno de producción (optimizaciones activadas)
   */
  production: false,

  /**
   * URL BASE DEL BACKEND
   * --------------------
   * Dirección base para todas las llamadas a la API del backend.
   * 
   * Formato esperado: protocolo://host:puerto/ruta-base
   * Ejemplo: 'http://localhost:8080/api/v1'
   * 
   * NOTA: Asegurar que no termine con '/'
   */
  backendUrl: 'http://localhost:8080/api/v1',

  /**
   * ENDPOINTS DE LA API
   * -------------------
   * Definición de todos los endpoints disponibles en el backend.
   * Cada endpoint es relativo a la backendUrl.
   * 
   * Estructura:
   * - Clave: Nombre descriptivo del recurso
   * - Valor: Ruta específica del endpoint (siempre comenzando con '/')
   */
  endpoints: {
    /**
     * Endpoint para gestión de registros
     * Uso: Operaciones CRUD sobre registros del sistema
     */
    registers: '/registers',

    /**
     * Endpoint para la capa de investigación
     * Uso: Funcionalidades específicas de investigación y análisis
     */
    researchLayer: '/ResearchLayer',

    /**
     * Endpoint para gestión de usuarios
     * Uso: Autenticación, autorización y administración de usuarios
     */
    users: '/users',

    /**
     * Endpoint para gestión de variables
     * Uso: Configuración y consulta de variables del sistema
     */
    variables: '/Variable'
  }
};

/**
 * NOTAS ADICIONALES:
 * ==================
 * 
 * 1. SEGURIDAD:
 *    - Este archivo se incluye en el bundle final, no usar datos sensibles
 *    - Para secrets, usar variables de entorno del sistema o servicios dedicados
 * 
 * 2. MANTENIMIENTO:
 *    - Actualizar este archivo cuando se agreguen nuevos endpoints
 *    - Mantener sincronizado con environment.prod.ts
 *    - Documentar cambios en los endpoints
 * 
 * 3. BUENAS PRÁCTICAS:
 *    - Usar nombres consistentes en inglés para los endpoints
 *    - Seguir convenciones RESTful en la nomenclatura
 *    - Agrupar endpoints relacionados bajo el mismo contexto
 */
