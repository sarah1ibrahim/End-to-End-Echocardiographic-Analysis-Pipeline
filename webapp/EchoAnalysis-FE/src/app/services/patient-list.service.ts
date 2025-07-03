import { catchError, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Interface } from 'readline';
import { Ipatients } from '../ipatients';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';
import { AuthService } from './auth-service.service';

@Injectable({
  providedIn: 'root'
})
export class PatientListService {
  private readonly _HttpClient=inject(HttpClient)
  private readonly _AuthService=inject(AuthService)

  constructor() { }

  getPatientData(cardiologistId:string):Observable<any>{
    return this._HttpClient.get(`http://localhost:5000/home/cardiologist/patients/${cardiologistId}`)
  }

  updatePatient(editedInfo:Ipatients):Observable<any>{
    const payload = {
    fname: editedInfo.first_name,
    lname: editedInfo.last_name,
    Bdate: editedInfo.Bdate,
    sex: editedInfo.sex,
    phone: editedInfo.phone,
    // cardiologistId: editedInfo.cardiologistId,
    weight: editedInfo.weight,
    height: editedInfo.height,
  };
  console.log('Payload:', payload);
    return this._HttpClient.put(`http://localhost:5000/home/admin/updatePatient/${editedInfo.id}`,payload)
  }
  deletePatient(patientId:Number):Observable<any>{
    return this._HttpClient.delete(`http://localhost:5000/home/cardiologist/${patientId}`,)

  }

  addPatient(patient: Partial<Ipatients>): Observable<Ipatients> {
    const url = "http://localhost:5000/home/cardiologist/addPatient";
    const payload = {
      fname: patient.first_name,
      lname: patient.last_name,
      Bdate: patient.Bdate,
      sex: patient.sex,
      phone: patient.phone,
      weight: patient.weight,
      height: patient.height,
    };
    console.log('POST request URL:', url);
    console.log('Payload:', payload);
    const token = this._AuthService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      token: token || '', // Match backend header expectation
    });
    return this._HttpClient
      .post<Ipatients>(url, payload, { headers })
      .pipe(
        catchError((error) => {
          console.error('Add patient failed:', error.status, error.error);
          return throwError(() => new Error(`Failed to add patient: ${error.error?.error || error.message}`));
        })
      );
  }
}
