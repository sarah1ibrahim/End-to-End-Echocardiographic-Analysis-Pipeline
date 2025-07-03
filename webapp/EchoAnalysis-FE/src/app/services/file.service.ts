import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private file: File | null = null;
  navigateToSegmentation:boolean=true
  private readonly _HttpClient=inject(HttpClient)
  

  setFile(file: File) {
    this.file = file;
  }

  getFile(): File | null {
    return this.file;
  }

  clearFile() {
    this.file = null;
  }

  uploadPatientFile(file: File, patientId: string):Observable<any>{
    const formData = new FormData();
    formData.append('path', file);
    formData.append('patientId', patientId);

    return this._HttpClient.post('http://localhost:5000/fileupload', formData, {
      
    });
  }

  uploadAndMeasure(file:File,patientId:String):Observable<any>{
    const formData = new FormData();
    formData.append('path', file);
    return this._HttpClient.post(`http://localhost:5000/fileupload/measure/${patientId}`,formData,{})
    // return this._HttpClient.post(`http://localhost:5000/fileupload/measure/${patientId}`,formData,{})
    


  }
  

  
}