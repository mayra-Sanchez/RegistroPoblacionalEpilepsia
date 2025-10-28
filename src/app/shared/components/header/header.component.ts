import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

interface UserLayerInfo {
  id: string;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isModalVisible = false;
  modalType: 'login' | 'manual' | 'userInfo' = 'login';
  isLoggedIn: boolean = false;
  username: string = '';
  userRole: string = '';
  userIcon: string = 'fa fa-user';
  isSettingsMenuVisible = false;
  fullName: string = '';
  currentUserData: any = {
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    identificationType: '',
    identificationNumber: '',
    birthDate: '',
    researchLayer: '',
    role: ''
  };
  userId: string | null = null;
  userInfoModalVisible = false;
  
  // Propiedades para las capas del usuario
  userLayers: UserLayerInfo[] = [];
  isLoadingLayers: boolean = false;
  private layersSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService, 
    private router: Router, 
    private adminService: ConsolaAdministradorService
  ) { }

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.userRole = this.authService.getUserRole();
    this.fullName = this.authService.getUserFullName();
    this.setUserIcon(this.userRole);

    this.authService.authStatus$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        this.userRole = this.authService.getUserRole();
        this.fullName = this.authService.getUserFullName();
        this.setUserIcon(this.userRole);
        this.loadUserData();
      } else {
        this.userIcon = 'fa fa-user';
        this.fullName = '';
        this.userLayers = [];
      }
    });
  }

  ngOnDestroy(): void {
    if (this.layersSubscription) {
      this.layersSubscription.unsubscribe();
    }
  }

  openModal(type: 'login' | 'manual' | 'userInfo'): void {
    this.modalType = type;
    this.isModalVisible = true;
    
    // Si es el modal de información de usuario, cargar datos actualizados
    if (type === 'userInfo') {
      this.loadUserData();
    }
  }

  closeModal(): void {
    this.isModalVisible = false;
    this.userInfoModalVisible = false;
  }

  navigateTo(route: string): void {
    this.closeModal();
  }

  handleLoginSuccess(): void {
    this.isModalVisible = false;
  }

  logout(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas cerrar sesión?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.isLoggedIn = false;
        this.router.navigate(['/']);
        Swal.fire('Sesión cerrada', '', 'success');
      }
    });
  }

  toggleSettingsMenu(): void {
    this.isSettingsMenuVisible = !this.isSettingsMenuVisible;
  }

  setUserIcon(role: string): void {
    switch (role) {
      case 'admin':
        this.userIcon = 'fa fa-user-shield';
        break;
      case 'doctor':
        this.userIcon = 'fa fa-user-md';
        break;
      case 'patient':
        this.userIcon = 'fa fa-user-injured';
        break;
      default:
        this.userIcon = 'fa fa-user';
    }
  }

  loadUserData(): void {
    this.username = this.authService.getUsername();
    this.userRole = this.authService.getUserRole();
    this.userId = this.authService.getUserId();

    if (this.userId) {
      this.loadCurrentUserData();
    } else {
      console.warn('No se pudo obtener el ID del usuario');
    }

    this.setUserIcon(this.userRole);
  }

  loadCurrentUserData(): void {
    const userEmail = this.authService.getUserEmail();

    if (!userEmail) {
      console.warn('No se pudo obtener el email del usuario');
      return;
    }

    this.authService.obtenerUsuarioPorEmail(userEmail).subscribe(
      (users) => {
        const currentUser = Array.isArray(users) ? users[0] : users;

        if (currentUser) {
          const attributes = currentUser.attributes || {};

          this.currentUserData = {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            enabled: currentUser.enabled,
            emailVerified: currentUser.emailVerified,
            createdTimestamp: currentUser.createdTimestamp,
            attributes: {
              identificationType: attributes.identificationType?.[0] || 'No especificado',
              identificationNumber: attributes.identificationNumber?.[0] || 'No especificado',
              birthDate: attributes.birthDate?.[0] || 'No especificado',
              researchLayerId: attributes.researchLayerId || [],
              role: attributes.role?.[0] || this.userRole
            }
          };

          if (!this.userId && currentUser.id) {
            this.userId = currentUser.id;
          }

          // Cargar información de las capas del usuario
          this.loadUserLayersInfo(attributes.researchLayerId || []);

          console.log('✅ Datos del usuario cargados:', this.currentUserData);
        }
      },
      (error) => {
        console.error('Error al cargar datos del usuario:', error);
        Swal.fire('Error', 'No se pudieron cargar los datos del usuario', 'error');
      }
    );
  }

  /**
   * Carga la información de las capas asociadas al usuario usando el servicio existente
   * @param layerIds Array de IDs de capas
   */
  private loadUserLayersInfo(layerIds: string[]): void {
    if (!layerIds || layerIds.length === 0) {
      this.userLayers = [];
      return;
    }

    this.isLoadingLayers = true;
    
    this.layersSubscription = this.adminService.getAllLayers().subscribe({
      next: (allLayers: any[]) => {
        // Filtrar las capas que coinciden con los IDs del usuario
        const userLayers = allLayers.filter(layer => 
          layerIds.includes(layer.id)
        ).map(layer => ({
          id: layer.id,
          name: layer.layerName || layer.name || 'Capa sin nombre',
          description: layer.description || layer.layerDescription
        }));
        
        this.userLayers = userLayers;
        this.isLoadingLayers = false;
        console.log('✅ Capas del usuario cargadas:', this.userLayers);
      },
      error: (error) => {
        console.error('Error al cargar información de capas:', error);
        // En caso de error, crear información básica con los IDs
        this.userLayers = this.getBasicLayerInfo(layerIds);
        this.isLoadingLayers = false;
      }
    });
  }

  /**
   * Crea información básica de capas cuando hay errores
   * @param layerIds Array de IDs de capas
   * @returns Array básico de información de capas
   */
  private getBasicLayerInfo(layerIds: string[]): UserLayerInfo[] {
    return layerIds.map(id => ({
      id: id,
      name: `Capa ${id.substring(0, 8)}...`,
      description: 'Información no disponible'
    }));
  }

  // Formatear fecha de nacimiento
  formatBirthDate(birthDate: string): string {
    if (!birthDate || birthDate === 'No especificado') return birthDate;
    
    try {
      const date = new Date(birthDate);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return birthDate;
    }
  }

  // Formatear fecha de creación
  formatCreatedDate(timestamp: number): string {
    if (!timestamp) return 'No disponible';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'No disponible';
    }
  }

  // Obtener el nombre del rol
  getRoleName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'admin': 'Administrador',
      'doctor': 'Médico/Digitador',
      'patient': 'Paciente',
      'Researcher': 'Investigador',
      'SuperAdmin': 'Super Administrador'
    };
    
    return roleNames[role] || role;
  }

  // Obtener el tipo de identificación completo
  getIdentificationType(type: string): string {
    const types: { [key: string]: string } = {
      'CC': 'Cédula de Ciudadanía',
      'TI': 'Tarjeta de Identidad',
      'CE': 'Cédula de Extranjería',
      'PA': 'Pasaporte'
    };
    
    return types[type] || type;
  }

  // Verificar si el usuario tiene capas asignadas
  hasUserLayers(): boolean {
    return this.userLayers && this.userLayers.length > 0;
  }

  // Obtener el número de capas del usuario
  getUserLayersCount(): number {
    return this.userLayers ? this.userLayers.length : 0;
  }
}