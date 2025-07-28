import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-help-guide',
  templateUrl: './admin-help-guide.component.html',
  styleUrls: ['./admin-help-guide.component.css']
})
export class AdminHelpGuideComponent {
  mostrarAyuda = false;
  showHelp: boolean = false;
  currentStep: number = 0;
  steps = [
    {
      title: 'Paso 1: Crear capa y rol en Superset',
      content: `🧱 Cuando crees una nueva capa en la consola, debes crear también un rol en Superset con el mismo nombre de la capa (por ejemplo: *demencia_en_niños*).`
    },
    {
      title: 'Paso 2: Crear regla RLS en Superset',
      content: `🔐 Ve a *Security > Row Level Security* en Superset y haz clic en *+ RLS Rule*. Luego, configura lo siguiente:

- **Rule Name**: usa el mismo nombre del rol, como *demencia_en_niños*.
- **Table Schema**: ` + '`mongo.epilepsyRegister`' + `
- **Table Name**: ` + '`registers`' + `
- **Filter Type**: *Regular*
- **Clause**: ` + '`researchLayerId = \'<ID de la capa>\'`' + `
- **Roles**: asigna el rol correspondiente (*demencia_en_niños*).
      
📌 Esta regla asegura que los usuarios con ese rol solo verán los registros asociados a su capa.`
    },
    {
      title: 'Paso 3: Registrar usuario y asignar roles',
      content: `👤 Al registrar un nuevo usuario, debes crearle una cuenta en Superset y asignarle estos roles:
- *alpha*
- *sql_lab*
- El rol de su capa, por ejemplo: *demencia_en_niños*

✅ Así el usuario podrá acceder a los dashboards filtrados según su capa.`
    }
  ];

  toggleHelp() {
    this.showHelp = !this.showHelp;
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
}
