// shared-pipes.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importación de pipes
import { SafeUrlPipe } from './safeUrl.pipe';

/**
 * Módulo compartido para pipes personalizados de la aplicación
 * 
 * Este módulo centraliza todos los pipes personalizados para facilitar
 * su importación y mantenimiento en toda la aplicación.
 * 
 * @remarks
 * El pipe incluido en este módulo es:
 * - SafeUrlPipe: Para sanitizar URLs de recursos
 */
@NgModule({
  declarations: [
    // ============================
    // LISTA DE PIPES PERSONALIZADOS
    // ============================
    SafeUrlPipe,
  ],
  exports: [
    // ============================
    // EXPORTAR TODOS LOS PIPES
    // ============================
    SafeUrlPipe,
  ],
  imports: [
    // ============================
    // MÓDULOS REQUERIDOS
    // ============================
    CommonModule
  ],
  // ============================
  // PROVEEDORES (opcional)
  // ============================
  providers: [
    /**
     * Los pipes generalmente no necesitan ser proveídos ya que
     * Angular los instancia automáticamente cuando se usan en templates.
     * Solo agregar aquí si se necesitan usar programáticamente.
     */
  ]
})
export class SharedPipesModule { }

