// interfaces.ts
export interface Variable {
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
}

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

export interface ResearchLayer {
  id: string;
  layerName: string;
  description: string;
  layerBoss: {
    id: number;
    name: string;
    identificationNumber: string;
  };
}

// interfaces.ts
export interface Register {
  registerId: string;
  registerDate: string;
  updateRegisterDate: string | null;
  patientIdentificationNumber: number;
  patientIdentificationType: string;
  variablesRegister: any[];
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
  } | null; // Añadir null aquí
  healthProfessional: {
    id: string;
    name: string;
    identificationNumber: number;
  } | null; // Añadir null aquí
}