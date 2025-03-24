import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/login/services/auth.service';
import { ConsolaRegistroService } from './services/consola-registro.service';
@Component({
  selector: 'app-consola-registro',
  templateUrl: './consola-registro.component.html',
  styleUrls: ['./consola-registro.component.css']
})
export class ConsolaRegistroComponent implements OnInit {
  selectedTab: string = 'inicioDigitador';

  jefeInvestigacion: string = '';
  contactoInvestigacion: string = '';
  capaUsuario: string = '';
  totalPacientes: number = 124;
  DescripcionInvestigacion: string = '';

  usuarioAutenticado: any = null;

  constructor(
    private consolaRegistroService: ConsolaRegistroService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.cargarDatosUsuario();
  }

  private cargarDatosUsuario(): void {
    const email = this.authService.getUserEmail();
    if (!email) {
      console.error('⚠️ No se pudo obtener el email del usuario autenticado.');
      return;
    }
  
    this.consolaRegistroService.obtenerUsuarioAutenticado(email).subscribe({
      next: (usuario) => {
        this.usuarioAutenticado = usuario;
        console.log('👤 Usuario autenticado:', usuario);
      },
      error: (error) => {
        console.error('❌ Error obteniendo usuario autenticado:', error);
      }
    });
  }
  

  onTabSelected(tab: string): void {
    this.selectedTab = tab;
  }

  usuariosData = [
    { nombre: 'Juan', apellido: 'González', documento: '987654321', fechaRegistro: '01/10/2023', registradoPor: 'Carlos Pérez' },
    { nombre: 'María', apellido: 'López', documento: '123456789', fechaRegistro: '15/11/2023', registradoPor: 'Ana Gómez' },
    { nombre: 'Pedro', apellido: 'Sánchez', documento: '112233445', fechaRegistro: '03/08/2023', registradoPor: 'Laura Jaimes' },
    { nombre: 'Luis', apellido: 'Martínez', documento: '556677889', fechaRegistro: '22/09/2023', registradoPor: 'Carlos Pérez' },
    { nombre: 'Ana', apellido: 'Torres', documento: '998877665', fechaRegistro: '05/12/2023', registradoPor: 'Ana Gómez' },
    { nombre: 'Javier', apellido: 'Ramírez', documento: '223344556', fechaRegistro: '11/07/2023', registradoPor: 'Laura Jaimes' },
    { nombre: 'Carla', apellido: 'Fernández', documento: '667788990', fechaRegistro: '19/10/2023', registradoPor: 'Carlos Pérez' },
    { nombre: 'Isabel', apellido: 'Pérez', documento: '445566778', fechaRegistro: '27/06/2023', registradoPor: 'Ana Gómez' },
    { nombre: 'Ricardo', apellido: 'García', documento: '556677889', fechaRegistro: '13/04/2023', registradoPor: 'Laura Jaimes' },
    { nombre: 'Raúl', apellido: 'Cordero', documento: '223355667', fechaRegistro: '29/05/2023', registradoPor: 'Carlos Pérez' }
  ];

  usuariosColumns = [
    { field: 'nombre', header: 'Nombre' },
    { field: 'apellido', header: 'Apellido' },
    { field: 'documento', header: 'Número de documento' },
    { field: 'fechaRegistro', header: 'Fecha de último registro' },
    { field: 'registradoPor', header: 'Registrado por' }
  ];

  handleView(row: any) {
    console.log('Ver', row);
  }

  handleEdit(row: any) {
    console.log('Editar', row);
  }
}
