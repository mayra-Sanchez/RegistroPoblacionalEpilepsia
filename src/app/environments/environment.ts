// environment.ts o environment.prod.ts

export const environment = {
  production: false,
  backendUrl: 'http://localhost:8080/api/v1',
  endpoints: {
    registers: '/registers',
    researchLayer: '/ResearchLayer',
    users: '/users',
    variables: '/Variable'
  }
};
