import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environments';

interface SupersetConfig {
  baseUrl: string;
  dashboardId: string;
  accessToken?: string;
  guestToken?: string;
}

@Component({
  selector: 'app-consulta-dinamica',
  templateUrl: './consulta-dinamica.component.html',
  styleUrls: ['./consulta-dinamica.component.css']
})
export class ConsultaDinamicaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private refreshInterval: any;

  // Configuration from environment
  supersetConfig: SupersetConfig = {
    baseUrl: environment.supersetBaseUrl,
    dashboardId: environment.supersetDashboardId
  };

  // State
  loading = true;
  error: string | null = null;
  embedUrl: SafeResourceUrl | null = null;
  lastRefresh = new Date();
  autoRefresh = false;
  refreshRate = 30000; // 30 seconds

  // Queries configuration
  queries = {
    patientBasicInfo: `
      SELECT
        r._id,
        CAST(r.patientBasicInfo.age AS VARCHAR) AS edad,
        CAST(r.patientBasicInfo.sex AS VARCHAR) AS sexo,
        CAST(r.patientBasicInfo.currentCity AS VARCHAR) AS ciudad_actual,
        CAST(r.patientBasicInfo.educationLevel AS VARCHAR) AS nivel_educativo,
        CAST(r.patientBasicInfo.economicStatus AS VARCHAR) AS estado_economico,
        CAST(r.patientBasicInfo.hometown AS VARCHAR) AS ciudad_natal,
        CAST(r.patientBasicInfo.maritalStatus AS VARCHAR) AS estado_civil,
        CAST(r.patientBasicInfo.crisisStatus AS VARCHAR) AS estado_crisis,
        CAST(r.patientBasicInfo.firstCrisisDate AS DATE) AS primera_crisis
      FROM mongo.epilepsyRegister.registers r
      WHERE r.patientBasicInfo IS NOT NULL
    `,
    caregiver: `
      SELECT
        r._id,
        CAST(r.caregiver.age AS VARCHAR) AS edad,
        CAST(r.caregiver.educationLevel AS VARCHAR) AS nivel_educativo,
        CAST(r.caregiver.occupation AS VARCHAR) AS ocupacion
      FROM mongo.epilepsyRegister.registers r
      WHERE r.caregiver IS NOT NULL
    `,
    variables: `
      SELECT
        r.variables.id,
        CAST(r.variables.name AS VARCHAR) AS nombre,
        CAST(r.variables.value AS VARCHAR) AS valor
      FROM mongo.epilepsyRegister.registers r
      WHERE r.variables IS NOT NULL
    `
  };

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.initializeSupersetConnection();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearRefreshInterval();
  }

  onIframeLoad(): void {
    console.log('Iframe loaded successfully');
    this.loading = false;
  }

  private initializeSupersetConnection(): void {
    this.loading = true;
    this.error = null;

    this.getAccessToken()
      .then(() => this.getGuestToken())
      .then(() => this.generateEmbedUrl())
      .catch(err => {
        console.error('Superset connection error:', err);
        this.error = this.getErrorMessage(err);
        this.loading = false;
      });
  }

  private getAccessToken(): Promise<void> {
    const url = `${this.supersetConfig.baseUrl}/api/v1/security/login`;
    return this.http.post<any>(url, {
      username: environment.supersetUsername,
      password: environment.supersetPassword,
      provider: 'db',
      refresh: true
    }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    })
    .pipe(takeUntil(this.destroy$))
    .toPromise()
    .then(response => {
      this.supersetConfig.accessToken = response.access_token;
      // Store token expiration (typically 1 hour)
      localStorage.setItem('superset_token_exp', (Date.now() + 3600000).toString());
    });
  }

  private getGuestToken(): Promise<void> {
    if (!this.supersetConfig.accessToken) {
      return Promise.reject('No access token available');
    }

    const url = `${this.supersetConfig.baseUrl}/api/v1/security/guest_token`;
    return this.http.post<any>(url, {
      user: {
        username: 'guest_user',
        first_name: 'Guest',
        last_name: 'User'
      },
      resources: [{
        type: 'dashboard',
        id: this.supersetConfig.dashboardId
      }],
      rls: []
    }, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supersetConfig.accessToken}`
      })
    })
    .pipe(takeUntil(this.destroy$))
    .toPromise()
    .then(response => {
      this.supersetConfig.guestToken = response.token;
    });
  }

  private generateEmbedUrl(): void {
    if (!this.supersetConfig.guestToken) {
      throw new Error('No guest token available');
    }

    const url = new URL(`${this.supersetConfig.baseUrl}/embedded/dashboard/${this.supersetConfig.dashboardId}`);
    url.searchParams.append('standalone', 'true');
    url.searchParams.append('show_filters', 'false');
    url.searchParams.append('guest_token', this.supersetConfig.guestToken);

    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url.toString());
    this.lastRefresh = new Date();
  }

  refreshDashboard(): void {
    this.initializeSupersetConnection();
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.setupRefreshInterval();
    } else {
      this.clearRefreshInterval();
    }
  }

  private setupRefreshInterval(): void {
    this.clearRefreshInterval();
    this.refreshInterval = setInterval(() => {
      if (this.isTokenExpired()) {
        this.initializeSupersetConnection();
      } else {
        this.refreshDashboard();
      }
    }, this.refreshRate);
  }

  private clearRefreshInterval(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private isTokenExpired(): boolean {
    const expTime = localStorage.getItem('superset_token_exp');
    return !expTime || parseInt(expTime) < Date.now();
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'No se pudo conectar al servidor Superset. Verifique su conexión de red.';
    }
    if (error.status === 401) {
      return 'Autenticación fallida. Por favor verifique sus credenciales.';
    }
    if (error.status === 403) {
      return 'Acceso denegado. Verifique los permisos CORS en el servidor Superset.';
    }
    if (error.error?.message) {
      return error.error.message;
    }
    return 'Ocurrió un error desconocido al conectar con Superset.';
  }
}