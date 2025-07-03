import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportServiceService {

  private readonly _HttpClient=inject(HttpClient)

  constructor() { }


  getReportContent(): Observable<any>{
     return this._HttpClient.get("http://localhost:5000/fileupload/report/3")
  }
}
