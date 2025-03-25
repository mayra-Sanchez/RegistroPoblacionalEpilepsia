interface Variable {
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
  
  interface ResearchLayer {
    id: string;
    layerName: string;
    description: string;
    layerBoss: {
      id: number;
      name: string;
      identificationNumber: string;
    };
  }
  
  interface UserResponse {
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