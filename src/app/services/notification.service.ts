// services/notification.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private dataChangedSource = new Subject<void>();
  dataChanged$ = this.dataChangedSource.asObservable();

  notifyDataChanged(): void {
    this.dataChangedSource.next();
  }
}