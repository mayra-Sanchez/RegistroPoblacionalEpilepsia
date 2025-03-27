import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/login/services/auth.service';
import { ConsolaRegistroService } from 'src/app/modules/consola-registro/services/consola-registro.service';

@Component({
  selector: 'app-profesional-form',
  templateUrl: './profesional-form.component.html',
  styleUrls: ['./profesional-form.component.css']
})
export class ProfesionalFormComponent implements OnInit {
  @Input() initialData: any;
  @Output() prev = new EventEmitter<void>();
  @Output() submit = new EventEmitter<any>();

  form: FormGroup;
  loading = true;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private consolaService: ConsolaRegistroService
  ) {
    this.form = this.fb.group({
      healthProfessionalId: ['', Validators.required],
      healthProfessionalName: ['', Validators.required],
      healthProfessionalIdentificationNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]]
    });
  }

  ngOnInit(): void {
    this.loadProfessionalData();
  }

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

  private processApiResponse(apiResponse: any): void {
    if (!apiResponse || !apiResponse[0]) {
      this.handleError('Respuesta del servidor inválida');
      this.loadFallbackData();
      return;
    }

    const apiData = apiResponse[0];
    const tokenData = this.authService.getUserData();

    const professionalData = {
      id: apiData.id || tokenData?.id || '',
      name: `${apiData.firstName || ''} ${apiData.lastName || ''}`.trim() || 
            tokenData?.firstName || 'Profesional',
      identificationNumber: apiData.attributes?.identificationNumber?.[0] || 
                          this.authService.getUserIdentificationNumber() || ''
    };

    this.form.setValue({
      healthProfessionalId: professionalData.id,
      healthProfessionalName: professionalData.name,
      healthProfessionalIdentificationNumber: professionalData.identificationNumber
    });

    // Deshabilitar campos después de cargar
    this.form.get('healthProfessionalId')?.disable();
    this.form.get('healthProfessionalName')?.disable();
    this.form.get('healthProfessionalIdentificationNumber')?.disable();
  }

  private loadFallbackData(): void {
    const tokenData = this.authService.getUserData();
    this.form.setValue({
      healthProfessionalId: tokenData?.id || 'No disponible',
      healthProfessionalName: tokenData?.firstName || 'No disponible',
      healthProfessionalIdentificationNumber: this.authService.getUserIdentificationNumber() || 'No disponible'
    });
    this.loading = false;
  }

  private handleError(message: string): void {
    console.error(message);
    this.errorMessage = message;
    this.loading = false;
  }

  onPrevious(): void {
    this.prev.emit();
  }

  onSubmit(): void {
    const formData = this.form.getRawValue(); // Esto incluye campos deshabilitados
    
    // Verificación manual de campos requeridos
    if (formData.healthProfessionalId && 
        formData.healthProfessionalName && 
        formData.healthProfessionalIdentificationNumber) {
      console.log('Enviando datos:', formData);
      this.submit.emit(formData);
    } else {
      this.errorMessage = 'Por favor complete todos los campos requeridos';
    }
  }
}