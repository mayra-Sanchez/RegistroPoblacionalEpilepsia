/**
 * Archivo de definición de interfaces para el sistema RPE.
 * Contiene las estructuras de datos principales utilizadas en la aplicación.
 */

/* --------------------------------------------------
 * VARIABLES
 * -------------------------------------------------- */

/** Información básica de una variable usada en registros */
export interface VariableInfo {
  variableId: string;
  variableName: string;
  variableType: string; // "number" | "text" | "string" | "date" | etc.
  valueAsString?: string | null;
  valueAsNumber?: number | null;
  valueAsDate?: Date | null;

  // opcionales (usados si el frontend necesita contexto extra)
  researchLayerId?: string;
  researchLayerName?: string;
  unit?: string;
  referenceRange?: string;
  lastUpdate?: string;
}

/** Definición completa de una variable en el sistema */
export interface Variable {
  selectionType: string;
  id: string;
  researchLayerId: string;
  variableName: string;
  description: string;
  type: string;
  hasOptions: boolean;
  isEnabled: boolean;
  options: string[];
  createdAt: string;
  updatedAt: string;
  isRequired?: boolean; // opcional
  name?: string;
  selectionTypes?: string;
  category?: string;
  order?: string;
}

/** Request para guardar/actualizar una variable */
export interface VariableRequest {
  id: string;
  variableName: string;
  value: any;
  type: string;
  researchLayerId: string;
  researchLayerName?: string;
}

/** Respuesta del backend con info de una variable */
export interface VariableInfoResponse {
  variableId: string;
  variableName: string;
  variableType: string;
  valueAsString?: string | null;
  valueAsNumber?: number | null;
}

/* --------------------------------------------------
 * CAPAS DE INVESTIGACIÓN
 * -------------------------------------------------- */
export interface ResearchLayer {
  id: string;
  researchLayerId: string;
  layerName: string;
  description: string;
  layerBoss: {
    id: number;
    name: string;
    identificationNumber: string;
  };
}

/* --------------------------------------------------
 * USUARIOS
 * -------------------------------------------------- */
export interface UserResponse {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  attributes?: {
    role?: string[];
    researchLayerId?: string[];
    identificationNumber?: string[];
    identificationType?: string[];
    birthDate?: string[];
  };
}

/* --------------------------------------------------
 * PACIENTES
 * -------------------------------------------------- */
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

/* --------------------------------------------------
 * REGISTROS (GET)
 * -------------------------------------------------- */
export interface Register {
  registerId?: string;
  patientIdentificationNumber: number;
  patientIdentificationType: string;
  registerDate?: string;
  updateRegisterDate?: string;
  patientBasicInfo?: {
    name: string;
    sex: string;
    birthDate: string;
    age: number;
    email: string;
    phoneNumber: string;
    deathDate?: string;
    economicStatus?: string;
    educationLevel?: string;
    maritalStatus?: string;
    hometown?: string;
    currentCity?: string;
    firstCrisisDate?: string;
    crisisStatus?: string;
  };
  caregiver?: {
    name: string;
    identificationType: string;
    identificationNumber: number;
    age: number;
    educationLevel: string;
    occupation: string;
  };
  healthProfessional?: {
    name: string;
    email: string;
  };
  registerInfo?: Array<{
    researchLayerId: string;
    researchLayerName: string;
  }>;
  variablesRegister?: Array<{
    variableId: string;
    variableName: string;
    value: any;
    type: string;
  }>;
}

/* --------------------------------------------------
 * REGISTROS (POST/PUT) - ACTUALIZADAS
 * -------------------------------------------------- */
export interface RegisterVariable {
  id: string;
  name: string;
  value: any;
  type: string;
}

export interface RegisterInfo {
  researchLayerId: string;
  researchLayerName: string;
  variablesInfo: RegisterVariable[];
}

export interface RegisterPatient extends PatientBasicInfo { }

export interface RegisterCaregiver {
  name: string;
  identificationType: string;
  identificationNumber: number;
  age: number;
  educationLevel: string;
  occupation: string;
}

// Interface para POST /api/v1/registers (según documentación Swagger)
export interface RegisterRequest {
  registerInfo: RegisterInfo;  // Objeto simple, no array
  patientIdentificationNumber: number;
  patientIdentificationType: string;
  patient: RegisterPatient;
  caregiver?: RegisterCaregiver;  // Opcional según el ejemplo de Swagger
}

// Interface para la respuesta de registro
export interface RegisterResponse {
  registerId: string;
  patientIdentificationNumber: number;
  patientIdentificationType: string;
  registerInfo: RegisterInfo[];
  patient: RegisterPatient;
  caregiver?: RegisterCaregiver | null;
}

// Alias para mantener compatibilidad con código existente
export interface RegisterResponse2 extends RegisterResponse { }

/* --------------------------------------------------
 * RESPUESTAS PAGINADAS
 * -------------------------------------------------- */
export interface PaginatedDataResponse<T = any> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

export interface PaginatedRegistersResponse<T = any> {
  registers: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

// Alias para compatibilidad
export interface PaginatedResponse<T = any> extends PaginatedDataResponse<T> { }

/* --------------------------------------------------
 * RESPUESTAS COMUNES
 * -------------------------------------------------- */
export interface BasicResponse {
  success: boolean;
  message: string;
  data?: any;
}

/* --------------------------------------------------
 * FORMULARIOS
 * -------------------------------------------------- */
export interface PacienteFormData {
  name: string;
  identificationType: string;
  identificationNumber: string;
  sex: string;
  birthDate: string;
  email: string;
  phoneNumber: string;
  deathDate?: string;
  economicStatus: string;
  educationLevel: string;
  maritalStatus: string;
  hometown: string;
  currentCity: string;
  firstCrisisDate: string;
  crisisStatus: string;
  tieneCuidador: boolean;
  cuidadorData?: RegisterCaregiver;
}

/* --------------------------------------------------
 * ERRORES
 * -------------------------------------------------- */
export interface ErrorWithCode extends Error {
  code: string;
  originalError?: any;
  status?: number;
}

/* --------------------------------------------------
 * BÚSQUEDA
 * -------------------------------------------------- */
export interface SearchMessage {
  type: 'info' | 'success' | 'error';
  text: string;
}

// Agrega estas interfaces al archivo interfaces.ts

/* --------------------------------------------------
 * HISTORIAL DE CAMBIOS
 * -------------------------------------------------- */
export interface VariableHistory {
  id: string;
  name: string;
  type: string;
  valueAsString: string | null;
  valueAsNumber: number | null;
}

export interface ResearchLayerGroupHistory {
  researchLayerId: string;
  researchLayerName: string;
  variables: VariableHistory[];
}

export interface RegisterHistory {
  id: string;
  registerId: string;
  changedBy: string;
  changedAt: string;
  operation: string;
  patientIdentificationNumber: number;
  isResearchLayerGroup: ResearchLayerGroupHistory;
}

export interface RegisterHistoryResponse {
  data: RegisterHistory[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}