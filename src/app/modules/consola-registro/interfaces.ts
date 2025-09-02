/**
 * Archivo de definición de interfaces para el sistema.
 * Contiene las estructuras de datos principales utilizadas en la aplicación.
 */

/**
 * Interfaz que representa una variable en el sistema.
 * Usada para definir las características de las variables de investigación.
 */

export interface VariableInfo {
  variableId: string;
  variableName: string;
  variableValue: any;
  variableType: string;
}
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
  researchLayerId: string;
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


export interface VariableInfo {
  variableId: string;
  variableName: string;
  variableType: string;
  valueAsString?: String | null;
  valueAsNumber?: Number | null;
  valueAsDate?: Date | null;
  // opcionales (si realmente los usas en tu app)
  researchLayerId?: string;
  researchLayerName?: string;
  unit?: string;
  referenceRange?: string;
  lastUpdate?: string;
}

export interface PatientBasicInfo {
  name: string;
  sex: string;
  birthDate: string | null;
  age: number;
  email: string;
  phoneNumber: string;
  deathDate: string | null;
  economicStatus: string;
  educationLevel: string;
  maritalStatus: string;
  hometown: string;
  currentCity: string;
  firstCrisisDate: string;
  crisisStatus: string;
  hasCaregiver?: boolean;
}

export interface VariableRequest {
  id: string;
  variableName: string;
  value: any;
  type: string; // 'number' | 'text' | 'boolean' | 'string' | 'string[]' | 'date'
  researchLayerId: string;
  researchLayerName?: string;
}

// --- Para RECIBIR del backend (GET) ---
export interface VariableInfoResponse {
  variableId: string;
  variableName: string;
  variableType: string;        // p.ej. 'number' | 'string' | 'text'
  valueAsString?: String | null;
  valueAsNumber?: Number | null;
  valueAsDate?: Date | null;
}

export interface Register {
  registerId: string;
  id?: string;
  registerDate: string;
  updateRegisterDate: string | null;
  updatedBy?: string;
  patientIdentificationNumber: number;
  patientIdentificationType: string;

  // ⬇️ El backend devuelve un ARREGLO
  registerInfo: Array<{
    researchLayerId: string;
    researchLayerName?: string | null;
    variablesInfo: VariableInfoResponse[];
  }>;

  // Útil para vistas: versión “aplanada”
  variablesRegister?: Array<{
    variableId: string;
    variableName: string;
    value: any;
    type: string;
    researchLayerId: string;
    researchLayerName?: string | null;
  }>;

  patientBasicInfo: {
    name: string;
    sex: string;
    birthDate: string | null;
    age: number;
    email: string;
    phoneNumber: string;
    deathDate: string | null;
    economicStatus: string;
    educationLevel: string;
    maritalStatus: string;
    hometown: string;
    currentCity: string;
    firstCrisisDate: string;
    crisisStatus: string;
    hasCaregiver?: boolean;
  };
  caregiver: {
    name: string;
    identificationType: string;
    identificationNumber: number;
    age: number;
    educationLevel: string;
    occupation: string;
  } | null;
  healthProfessional: {
    id: string;
    name: string;
    identificationNumber: number;
  } | null;
}
