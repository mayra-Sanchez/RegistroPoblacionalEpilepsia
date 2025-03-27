import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/login/services/auth.service';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';

/**
 * Componente de formulario para la captura de información del profesional de salud
 * 
 * Este componente carga automáticamente los datos del profesional autenticado desde:
 * 1. La API a través de ConsolaRegistroService
 * 2. Los datos del token JWT como fallback
 * 
 * Los campos se muestran como deshabilitados ya que son datos del profesional logueado.
 * 
 * @example
 * <app-profesional-form
 *   [initialData]="professionalData"
 *   (prev)="goToPreviousStep()"
 *   (submit)="handleProfessionalSubmit($event)">
 * </app-profesional-form>
 */
@Component({
  selector: 'app-profesional-form',
  templateUrl: './profesional-form.component.html',
  styleUrls: ['./profesional-form.component.css']
})
export class ProfesionalFormComponent implements OnInit {
  /**
   * Datos iniciales para el formulario (opcional)
   */
  @Input() initialData: any;

  /**
   * Evento emitido al hacer clic en el botón "Anterior"
   */
  @Output() prev = new EventEmitter<void>();

  /**
   * Evento emitido al enviar el formulario con los datos del profesional
   */
  @Output() submit = new EventEmitter<any>();

  /**
   * Formulario reactivo para los datos del profesional
   */
  form: FormGroup;

  /**
   * Indica si se está cargando la información del profesional
   */
  loading = true;

  /**
   * Mensaje de error en caso de fallo al cargar los datos
   */
  errorMessage: string | null = null;

  /**
   * Constructor del componente
   * 
   * @param fb - Servicio para construir formularios reactivos
   * @param authService - Servicio de autenticación
   * @param consolaService - Servicio para obtener datos del profesional
   */
  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private consolaService: ConsolaRegistroService
  ) {
    this.form = this.fb.group({
      /**
       * ID del profesional de salud
       * @validations Requerido
       */
      healthProfessionalId: ['', Validators.required],

      /**
       * Nombre completo del profesional
       * @validations Requerido
       */
      healthProfessionalName: ['', Validators.required],

      /**
       * Número de identificación del profesional
       * @validations 
       * - Requerido
       * - Solo números (expresión regular ^[0-9]+$)
       */
      healthProfessionalIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]]
    });
  }

  /**
   * Método del ciclo de vida que se ejecuta al inicializar el componente
   */
  ngOnInit(): void {
    this.loadProfessionalData();
  }

  /**
   * Carga los datos del profesional autenticado
   * 
   * @remarks
   * Intenta obtener los datos primero desde la API, si falla usa los datos del token JWT
   */
  private loadProfessionalData(): void {
    const email = this.authService.getUserEmail();
    if (!email) {
      this.handleError('No se pudo obtener el email del usuario');
      return;
    }

    this.consolaService.obtenerUsuarioAutenticado(email).subscribe({
      next: (apiResponse) => {
        this.processApiResponse(apiResponse);
        this.loading = false;
      },
      error: (err) => {
        this.handleError(err.message || 'Error al cargar datos del profesional');
        this.loadFallbackData();
      }
    });
  }

  /**
   * Procesa la respuesta de la API para extraer los datos del profesional
   * 
   * @param apiResponse - Respuesta de la API con los datos del profesional
   */
  private processApiResponse(apiResponse: any): void {
    if (!apiResponse || !apiResponse[0]) {
      this.handleError('Respuesta del servidor inválida');
      this.loadFallbackData();
      return;
    }

    const apiData = apiResponse[0];
    const tokenData = this.authService.getUserData();

    // Construye el objeto con datos de la API o del token como fallback
    const professionalData = {
      id: apiData.id || tokenData?.id || '',
      name: `${apiData.firstName || ''} ${apiData.lastName || ''}`.trim() || 
            tokenData?.firstName || 'Profesional',
      identificationNumber: apiData.attributes?.identificationNumber?.[0] || 
                          this.authService.getUserIdentificationNumber() || ''
    };

    // Asigna los valores al formulario
    this.form.setValue({
      healthProfessionalId: professionalData.id,
      healthProfessionalName: professionalData.name,
      healthProfessionalIdentificationNumber: professionalData.identificationNumber
    });

    // Deshabilita los campos ya que son información del profesional logueado
    this.disableFormFields();
  }

  /**
   * Deshabilita todos los campos del formulario
   */
  private disableFormFields(): void {
    this.form.get('healthProfessionalId')?.disable();
    this.form.get('healthProfessionalName')?.disable();
    this.form.get('healthProfessionalIdentificationNumber')?.disable();
  }

  /**
   * Carga datos de fallback desde el token JWT
   */
  private loadFallbackData(): void {
    const tokenData = this.authService.getUserData();
    this.form.setValue({
      healthProfessionalId: tokenData?.id || 'No disponible',
      healthProfessionalName: tokenData?.firstName || 'No disponible',
      healthProfessionalIdentificationNumber: this.authService.getUserIdentificationNumber() || 'No disponible'
    });
    this.loading = false;
  }

  /**
   * Maneja errores durante la carga de datos
   * 
   * @param message - Mensaje de error a mostrar
   */
  private handleError(message: string): void {
    console.error(message);
    this.errorMessage = message;
    this.loading = false;
  }

  /**
   * Maneja el evento de clic en el botón "Anterior"
   */
  onPrevious(): void {
    this.prev.emit();
  }

  /**
   * Maneja el envío del formulario
   * 
   * @remarks
   * Emite los datos del formulario (incluyendo campos deshabilitados)
   * después de validar que todos los campos requeridos tengan valores
   */
  onSubmit(): void {
    const formData = this.form.getRawValue(); // Incluye campos deshabilitados
    
    // Verificación manual de campos requeridos
    if (formData.healthProfessionalId && 
        formData.healthProfessionalName && 
        formData.healthProfessionalIdentificationNumber) {
      this.submit.emit(formData);
    } else {
      this.errorMessage = 'Por favor complete todos los campos requeridos';
    }
  }
}