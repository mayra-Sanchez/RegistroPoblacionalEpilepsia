import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ConsolaAdministradorService } from 'src/app/services/consola-administrador.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isModalVisible = false;
  modalType: 'login' | 'manual' | 'edit-user' = 'login'; 
  isLoggedIn: boolean = false;
  username: string = '';
  userRole: string = '';
  userIcon: string = 'fa fa-user';
  isSettingsMenuVisible = false;
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

  constructor(private authService: AuthService, private router: Router,     private adminService: ConsolaAdministradorService) { }

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.username = this.authService.getUsername();
    this.userRole = this.authService.getUserRole();
    this.setUserIcon(this.userRole);

    this.authService.authStatus$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        this.username = this.authService.getUsername();
        this.userRole = this.authService.getUserRole();
        this.setUserIcon(this.userRole);
        this.loadUserData();
      } else {
        this.userIcon = 'fa fa-user';
      }
    });
  }

  openModal(type: 'login' | 'manual'): void {
    this.modalType = type;
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;

  }


  navigateTo(route: string): void {
    this.closeModal();
  }

  handleLoginSuccess(): void {
    this.isModalVisible = false;
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.router.navigate(['/']);
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
    
    if (this.userId) { // Ahora TypeScript sabe que this.userId es string aquí
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
            ...currentUser, // Pasamos todo el objeto original
            attributes: {   // Pero organizamos mejor los attributes
              identificationType: attributes.identificationType?.[0] || '',
              identificationNumber: attributes.identificationNumber?.[0] || '',
              birthDate: attributes.birthDate?.[0] || '',
              researchLayerId: attributes.researchLayerId?.[0] || '',
              role: attributes.role?.[0] || this.userRole
            }
          };
  
          if (!this.userId && currentUser.id) {
            this.userId = currentUser.id;
          }
        }
      },
      (error) => {
        console.error('Error al cargar datos del usuario:', error);
      }
    );
  }

  // Método para abrir el modal de edición
  openEditUserModal(): void {
    this.modalType = 'edit-user';
    this.isModalVisible = true;
    this.isSettingsMenuVisible = false;
  }

  // Método para manejar la actualización del usuario
  handleUserUpdate(updatedData: any): void {
    if (!this.userId) {
      console.error('No hay ID de usuario disponible');
      return;
    }
  
    const userData = {
      firstName: updatedData.firstName,
      lastName: updatedData.lastName,
      username: updatedData.username,
      email: updatedData.email,
      attributes: {
        identificationType: [updatedData.identificationType],
        identificationNumber: [updatedData.identificationNumber],
        birthDate: [updatedData.birthDate],
        researchLayerId: [updatedData.researchLayer],
        role: [updatedData.role]
      }
    };
  
    this.adminService.updateUsuario(this.userId, userData).subscribe(
      (response) => {
        // Actualizar datos locales
        this.currentUserData = {
          ...this.currentUserData,
          ...userData
        };
        
        this.authService.updateUserData({
          username: updatedData.username,
          firstName: updatedData.firstName,
          lastName: updatedData.lastName,
        });
        
        this.closeModal();
      },
      (error) => {
        console.error('Error al actualizar usuario:', error);
      }
    );
  }
}