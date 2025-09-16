import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormResetService {
  private resetSubject = new Subject<void>();

  resetForm$ = this.resetSubject.asObservable();

  triggerReset() {
    this.resetSubject.next();
  }
}