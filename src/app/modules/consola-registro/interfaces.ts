/**
 * Archivo de definición de interfaces para el sistema.
 * Contiene las estructuras de datos principales utilizadas en la aplicación.
 */

/**
 * Interfaz que representa una variable en el sistema.
 * Usada para definir las características de las variables de investigación.
 */
export interface Variable {
  /** Identificador único de la variable */
  id: string;
  /** ID de la capa de investigación a la que pertenece */
  researchLayerId: string;
  /** Nombre de la variable */
  variableName: string;
  /** Descripción detallada de la variable */
  description: string;
  /** Tipo de dato que almacena la variable */
  type: string;
  /** Indica si la variable tiene opciones predefinidas */
  hasOptions: boolean;
  /** Indica si la variable está habilitada para uso */
  isEnabled: boolean;
  /** Lista de opciones disponibles (si hasOptions es true) */
  options: string[];
  /** Fecha de creación en formato ISO */
  createdAt: string;
  /** Fecha de última actualización en formato ISO */
  updatedAt: string;
}

/**
 * Interfaz para la respuesta del servicio de usuarios.
 * Representa los datos básicos de un usuario y sus atributos extendidos.
 */
export interface UserResponse {
  /** ID único del usuario (opcional) */
  id?: string;
  /** Primer nombre del usuario (opcional) */
  firstName?: string;
  /** Apellido del usuario (opcional) */
  lastName?: string;
  /** Email del usuario (opcional) */
  email?: string;
  /** Objeto con atributos adicionales del usuario */
  attributes?: {
    /** Roles del usuario en el sistema */
    role?: string[];
    /** IDs de capas de investigación asociadas */
    researchLayerId?: string[];
    /** Número de identificación */
    identificationNumber?: string[];
    /** Tipo de identificación */
    identificationType?: string[];
    /** Fecha de nacimiento */
    birthDate?: string[];
  };
}

/**
 * Interfaz que representa una capa de investigación.
 * Una capa agrupa variables y registros relacionados.
 */
export interface ResearchLayer {
  /** ID único de la capa */
  id: string;
  /** Nombre descriptivo de la capa */
  layerName: string;
  /** Descripción detallada de la capa */
  description: string;
  /** Información del responsable de la capa */
  layerBoss: {
    /** ID del responsable */
    id: number;
    /** Nombre completo del responsable */
    name: string;
    /** Número de identificación del responsable */
    identificationNumber: string;
  };
}

/**
 * Interfaz que representa un registro completo en el sistema.
 * Contiene información del paciente, variables registradas y metadatos.
 */
export interface Register {
  /** ID de la capa de investigación asociada */
  researchLayerId: string;
  /** ID único del registro */
  registerId: string;
  /** ID alternativo (opcional) */
  id?: string;
  /** Fecha de creación del registro en formato ISO */
  registerDate: string;
  /** Usuario que realizó la última actualización (opcional) */
  updatedBy?: string;
  /** Fecha de última actualización (puede ser null si no hay actualizaciones) */
  updateRegisterDate: string | null;
  /** Número de identificación del paciente */
  patientIdentificationNumber: number;
  /** Tipo de identificación del paciente */
  patientIdentificationType: string;
  /** Array con las variables registradas */
  variablesRegister: any[];
  /** Información básica del paciente */
  patientBasicInfo: {
    /** Nombre completo del paciente */
    name: string;
    /** Sexo del paciente */
    sex: string;
    /** Fecha de nacimiento (puede ser null) */
    birthDate: string | null;
    /** Edad del paciente */
    age: number;
    /** Email de contacto */
    email: string;
    /** Número de teléfono */
    phoneNumber: string;
    /** Fecha de fallecimiento (opcional) */
    deathDate: string | null;
    /** Nivel socioeconómico */
    economicStatus: string;
    /** Nivel educativo */
    educationLevel: string;
    /** Estado civil */
    maritalStatus: string;
    /** Ciudad de origen */
    hometown: string;
    /** Ciudad de residencia actual */
    currentCity: string;
    /** Fecha de primera crisis (opcional) */
    firstCrisisDate: string;
    /** Estado de crisis actual */
    crisisStatus: string;
    /** Indica si tiene cuidador (opcional) */
    hasCaregiver?: boolean;
  };
  /** Información del cuidador (puede ser null si no tiene) */
  caregiver: {
    /** Nombre completo del cuidador */
    name: string;
    /** Tipo de identificación */
    identificationType: string;
    /** Número de identificación */
    identificationNumber: number;
    /** Edad del cuidador */
    age: number;
    /** Nivel educativo */
    educationLevel: string;
    /** Ocupación */
    occupation: string;
  } | null;
  /** Información del profesional de salud (puede ser null) */
  healthProfessional: {
    /** ID del profesional */
    id: string;
    /** Nombre completo */
    name: string;
    /** Número de identificación */
    identificationNumber: number;
  } | null;
}

/**
 * Interfaz para el cuerpo de la petición al crear/actualizar un registro.
 * Representa los datos necesarios para crear o actualizar un registro.
 */
interface RegisterRequestBody {
  /** Lista de variables a registrar */
  variables: Array<{
    /** ID de la variable */
    id: string;
    /** Nombre de la variable (opcional) */
    variableName?: string;
    /** Valor asignado a la variable */
    value: any;
    /** Tipo de dato de la variable */
    type: string;
    /** ID de la capa de investigación asociada */
    researchLayerId: string;
  }>;
  /** Número de identificación del paciente */
  patientIdentificationNumber: number;
  /** Tipo de identificación del paciente */
  patientIdentificationType: string;
  /** Información del paciente */
  patient: {
    /** Nombre completo */
    name: string;
    /** Sexo */
    sex: string;
    /** Fecha de nacimiento */
    birthDate: string;
    /** Edad */
    age: number;
    /** Email */
    email: string;
    /** Teléfono */
    phoneNumber: string;
    /** Fecha de fallecimiento (opcional) */
    deathDate?: string;
    /** Nivel socioeconómico */
    economicStatus: string;
    /** Nivel educativo */
    educationLevel: string;
    /** Estado civil */
    maritalStatus: string;
    /** Ciudad de origen */
    hometown: string;
    /** Ciudad de residencia */
    currentCity: string;
    /** Fecha de primera crisis (opcional) */
    firstCrisisDate?: string;
    /** Estado de crisis (opcional) */
    crisisStatus?: string;
  };
  /** Información del cuidador (opcional) */
  caregiver?: {
    /** Nombre completo */
    name: string;
    /** Tipo de identificación */
    identificationType: string;
    /** Número de identificación */
    identificationNumber: number;
    /** Edad */
    age: number;
    /** Nivel educativo */
    educationLevel: string;
    /** Ocupación */
    occupation: string;
  };
  /** Información del profesional de salud (opcional) */
  healthProfessional?: {
    /** ID del profesional */
    id: string;
    /** Nombre completo */
    name: string;
    /** Número de identificación */
    identificationNumber: number;
  };
}