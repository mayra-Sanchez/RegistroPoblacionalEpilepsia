import { TestBed } from '@angular/core/testing';

import { ConsolaAdministradorService } from './consola-administrador.service';

describe('ConsolaAdministradorService', () => {
  let service: ConsolaAdministradorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsolaAdministradorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
