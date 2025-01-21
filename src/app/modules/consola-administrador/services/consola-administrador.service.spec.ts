import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsolaAdministradorService } from './consola-administrador.service';

describe('ConsolaAdministradorService', () => {
  let service: ConsolaAdministradorService;
  let httpTestingController: HttpTestingController;

  // Antes de cada prueba, configuramos el módulo de pruebas y el servicio
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Importamos el módulo de pruebas HTTP
      providers: [ConsolaAdministradorService], // Proveemos el servicio
    });

    service = TestBed.inject(ConsolaAdministradorService); // Inyectamos el servicio
    httpTestingController = TestBed.inject(HttpTestingController); // Inyectamos el controlador de pruebas HTTP
  });

  // Después de cada prueba, verificamos que no haya solicitudes abiertas
  afterEach(() => {
    httpTestingController.verify();
  });

  it('debería obtener todas las capas', () => {
    const mockLayers = [
      { id: 1, nombreCapa: 'Capa 1', descripcion: 'Descripción de la capa 1' },
      { id: 2, nombreCapa: 'Capa 2', descripcion: 'Descripción de la capa 2' }
    ];

    service.getAllLayers().subscribe(layers => {
      expect(layers.length).toBe(2);
      expect(layers).toEqual(mockLayers);
    });

    // Simulamos la respuesta HTTP
    const req = httpTestingController.expectOne('http://localhost:8080/ResearchLayer/GetAll');
    expect(req.request.method).toBe('GET');
    req.flush(mockLayers); // Enviamos la respuesta simulada
  });

  it('debería registrar una nueva capa', () => {
    const newLayer = {
      id: null,  // Esto es correcto para el envío
      nombreCapa: 'Nueva Capa',
      descripcion: 'Descripción de la nueva capa',
      jefeCapa: { id: 1, nombre: 'Jefe Capa', numero_identificacion: '123' }
    };
  
    const mockResponse = {
      id: 1,  // El id debe ser asignado en la respuesta simulada
      nombreCapa: 'Nueva Capa',
      descripcion: 'Descripción de la nueva capa',
      jefeCapa: { id: 1, nombre: 'Jefe Capa', numero_identificacion: '123' }
    };
  
    service.registrarCapa(newLayer).subscribe(response => {
      expect(response.id).toBe(1);  // Verifica que el id no sea null después de la respuesta
      expect(response.nombreCapa).toBe('Nueva Capa');
    });
  
    const req = httpTestingController.expectOne('http://localhost:8080/ResearchLayer');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newLayer);  // Verifica que el cuerpo enviado tenga el id null
    req.flush(mockResponse);  // Enviamos la respuesta simulada
  });
  
  

  it('debería manejar el error al obtener las capas', () => {
    const errorMessage = 'No se pudieron obtener las capas del servidor.';

    service.getAllLayers().subscribe({
      next: () => fail('Se esperaba un error'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);
      }
    });

    // Simulamos un error 500 en la solicitud
    const req = httpTestingController.expectOne('http://localhost:8080/ResearchLayer/GetAll');
    expect(req.request.method).toBe('GET');
    req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
  });

  it('debería crear una nueva variable', () => {
    const newVariable = {
      id: null,  // Se mantiene como null
      idCapaInvestigacion: 1,
      nombreVariable: 'Variable 1',
      descripcion: 'Descripción de la variable 1',
      tipo: 'Tipo 1'
    };
  
    // Aquí creamos mockResponse sin usar el spread operator en el id
    const mockResponse = {
      id: 1,  // El id lo definimos directamente en la respuesta simulada
      idCapaInvestigacion: newVariable.idCapaInvestigacion,
      nombreVariable: newVariable.nombreVariable,
      descripcion: newVariable.descripcion,
      tipo: newVariable.tipo
    };
  
    service.crearVariable(newVariable).subscribe(response => {
      expect(response.id).toBe(1);  // Verificamos que el id sea 1
      expect(response.nombreVariable).toBe('Variable 1');
    });
  
    const req = httpTestingController.expectOne('http://localhost:8080/Variable');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id: null, // Asegúrate de que en el cuerpo de la solicitud el id sea null
      idCapaInvestigacion: 1,
      nombreVariable: 'Variable 1',
      descripcion: 'Descripción de la variable 1',
      tipo: 'Tipo 1'
    });
    req.flush(mockResponse); // Enviamos la respuesta simulada
  });
  
  

  it('debería manejar el error al crear la variable', () => {
    const errorMessage = 'No se pudo crear la variable. Por favor, verifica los datos y vuelve a intentarlo.';
  
    service.crearVariable({} as any).subscribe({
      next: () => fail('Se esperaba un error'),
      error: (error) => {
        expect(error.message).toBe(errorMessage);  // Verifica el mensaje de error completo
      }
    });
  
    const req = httpTestingController.expectOne('http://localhost:8080/Variable');
    expect(req.request.method).toBe('POST');
    req.flush(errorMessage, { status: 400, statusText: 'Bad Request' });
  });
  
  

  it('debería obtener todas las variables', () => {
    const mockVariables = [
      { id: 1, nombreVariable: 'Variable 1', descripcion: 'Descripción de la variable 1', tipo: 'Tipo 1' },
      { id: 2, nombreVariable: 'Variable 2', descripcion: 'Descripción de la variable 2', tipo: 'Tipo 2' }
    ];

    service.getAllVariables().subscribe(variables => {
      expect(variables.length).toBe(2);
      expect(variables).toEqual(mockVariables);
    });

    // Simulamos la respuesta HTTP
    const req = httpTestingController.expectOne('http://localhost:8080/Variable/GetAll');
    expect(req.request.method).toBe('GET');
    req.flush(mockVariables); // Enviamos la respuesta simulada
  });
});
