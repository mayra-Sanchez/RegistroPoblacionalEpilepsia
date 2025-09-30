import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './Guard/authGuard';

/**
 * Configuración de rutas principales de la aplicación.
 * 
 * Define la estructura de navegación y las reglas de acceso para cada módulo.
 * Utiliza lazy loading para cargar módulos bajo demanda y AuthGuard para protección de rutas.
 * 
 * @example
 * // Estructura de rutas:
 * // - '/' -> HomeComponent (pública)
 * // - '/registro' -> Módulo de registro (requiere rol Doctor)
 * // - '/administrador' -> Módulo de administración (requiere rol Admin o SuperAdmin)
 * // - '/investigador' -> Módulo de investigador (requiere rol Researcher)
 */
const routes: Routes = [
  /**
   * Ruta principal - Página de inicio
   * Acceso: Público
   */
  { 
    path: '', 
    component: HomeComponent, 
    pathMatch: 'full' 
  },

  /**
   * Ruta del módulo de registro de pacientes
   * Acceso: Exclusivo para usuarios con rol de Doctor
   * 
   * @description
   * Carga bajo demanda el módulo de consola de registro que contiene:
   * - Gestión de registros médicos
   * - Creación y edición de pacientes
   * - Historial clínico
   * - Variables de investigación
   */
  {
    path: 'registro',
    loadChildren: () =>
      import('./modules/consola-registro/consola-registro.module').then((m) => m.ConsolaRegistroModule),
    canActivate: [AuthGuard],
    data: { 
      roles: ['Doctor_client_role'],
      description: 'Módulo de registro médico para doctores'
    },
  },

  /**
   * Ruta del módulo de administración del sistema
   * Acceso: Usuarios con rol de Administrador o SuperAdministrador
   * 
   * @description
   * Carga bajo demanda el módulo de consola administrativa que contiene:
   * - Gestión de usuarios
   * - Configuración del sistema
   * - Reportes y estadísticas
   * - Administración de capas de investigación
   */
  {
    path: 'administrador',
    loadChildren: () => import('./modules/consola-administrador/consola-administrador.module').then(m => m.AdminModule),
    canActivate: [AuthGuard],
    data: { 
      roles: ['Admin_client_role', 'SuperAdmin_client_role'],
      description: 'Módulo administrativo para gestión del sistema'
    }
  },

  /**
   * Ruta del módulo de investigación y análisis
   * Acceso: Exclusivo para usuarios con rol de Investigador
   * 
   * @description
   * Carga bajo demanda el módulo de consola de investigación que contiene:
   * - Análisis de datos de investigación
   * - Reportes estadísticos
   * - Visualización de datos
   * - Herramientas de investigación
   */
  {
    path: 'investigador',
    loadChildren: () =>
      import('./modules/consola-investigador/consola-investigador.module').then((m) => m.ConsolaInvestigadorModule),
    canActivate: [AuthGuard],
    data: { 
      roles: ['Researcher_client_role'],
      description: 'Módulo de investigación para análisis de datos'
    },
  },
];

/**
 * Módulo de enrutamiento principal de la aplicación.
 * 
 * Responsabilidades:
 * - Configurar el enrutamiento principal
 * - Implementar lazy loading para módulos funcionales
 * - Aplicar guards de autenticación y autorización
 * - Definir políticas de acceso basadas en roles
 * 
 * @usage
 * Este módulo debe ser importado solo en el AppModule principal
 * 
 * @example
 * // En app.module.ts:
 * @NgModule({
 *   imports: [AppRoutingModule],
 *   // ... otras importaciones
 * })
 * export class AppModule { }
 */
@NgModule({
  /**
   * Configura el RouterModule con las rutas definidas
   * forRoot() se usa solo en el módulo de rutas principal
   */
  imports: [RouterModule.forRoot(routes, {
    // Configuraciones adicionales del router pueden ir aquí:
    // enableTracing: true, // Para debugging de rutas
    // useHash: false, // Para modo hash en la URL
    // scrollPositionRestoration: 'enabled' // Restaurar posición de scroll
  })],
  
  /**
   * Exporta RouterModule para que esté disponible en toda la aplicación
   */
  exports: [RouterModule],
})
export class AppRoutingModule { }

