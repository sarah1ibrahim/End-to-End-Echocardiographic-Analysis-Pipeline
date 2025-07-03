import { Component, inject, OnInit } from '@angular/core';
import { PatientListService } from '../services/patient-list.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ipatients } from '../ipatients';

// interface Ipatients {
//   id: number;
//   cardiologistId: number;
//   first_name: string;
//   last_name: string;
//   Bdate: string;
//   sex: string;
//   phone: string;
//   weight: number;
//   height: number;
//   createdAt: string;
//   updatedAt: string;
// }



@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule,FormsModule], // Add FormsModule if using ngModel for form inputs
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css'],
})
export class PatientListComponent implements OnInit {
  private readonly _PatientListService = inject(PatientListService);
  patientsList!: Ipatients[];
  editingPatientId: number | null = null; // Track the ID of the patient being edited
  editedPatient: Ipatients | null = null; // Store the patient data being edited

  showAddForm: boolean = false; // Toggle add patient form
  newPatient: Partial<Ipatients> = {
    first_name: '',
    last_name: '',
    Bdate: '',
    sex: 'Male',
    phone: '',
    weight: undefined,
    height: undefined,
    cardiologistId: 6, // Default cardiologistId (adjust based on auth)
  };

  constructor() {}

  ngOnInit(): void {
    this._PatientListService.getPatientData('6').subscribe({
      next: (response) => {
        console.log('success', response.patients);
        this.patientsList = response.patients;
      },
      error: (error) => {
        console.log('error', error.message);
      },
    });
  }

  calcBirthDate(Bdate: string): number {
    const birthDate = new Date(Bdate);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }
    return years;
  }

  // Start editing a patient
  startEdit(patient: Ipatients): void {
    this.editingPatientId = patient.id;
    // Create a copy of the patient to edit
    this.editedPatient = { ...patient };
  }

  // Save the edited patient
  saveEdit(): void {
  if (this.editedPatient && this.editingPatientId !== null) {
    // Basic validation
    if (!this.editedPatient.first_name || !this.editedPatient.last_name) {
      console.error('First name and last name are required');
      return;
    }
    // if (!/^\d{10}$/.test(this.editedPatient.phone)) {
    //   console.error('Phone must be a 10-digit number');
    //   return;
    // }
    console.log('Sending edited patient:', this.editedPatient);
    this._PatientListService.updatePatient(this.editedPatient).subscribe({
      next: (response) => {
        console.log('Patient updated', response);
        this.patientsList = this.patientsList.map((p) =>
          p.id === this.editingPatientId ? { ...this.editedPatient! } : p
        );
        this.cancelEdit();
      },
      error: (error) => {
        console.error('Error updating patient:', error.status, error.error);
      },
    });
  }
}

  // Cancel editing
  cancelEdit(): void {
    this.editingPatientId = null;
    this.editedPatient = null;
  }


  deletePatient(patientId: number, patientName: string): void {
    if (window.confirm(`Are you sure you want to delete ${patientName}? This action cannot be undone.`)) {
      this._PatientListService.deletePatient(patientId).subscribe({
        next: () => {
          console.log(`Patient ${patientId} deleted`);
          this.patientsList = this.patientsList.filter((p) => p.id !== patientId);
          alert('Patient deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting patient:', error.error);
          alert(`Error: ${error.error?.error || error.message}`);
        },
      });
    }
  
  }


  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newPatient = {
        first_name: '',
        last_name: '',
        Bdate: '',
        sex: 'Male',
        phone: '',
        weight: undefined,
        height: undefined,
        cardiologistId: 6, // Adjust based on auth
      };
    }
  }

  addPatient(): void {
    if (!this.newPatient.first_name || !this.newPatient.last_name) {
      alert('First name and last name are required!');
      return;
    }
    if (!this.newPatient.phone) {
      alert('Phone number is required!');
      return;
    }
    this._PatientListService.addPatient(this.newPatient).subscribe({
      next: (response) => {
        console.log('Patient added', response);
        this.patientsList = [...this.patientsList, response]; // Add new patient to list
        this.toggleAddForm(); // Hide form
        // alert('Patient added successfully');
      },
      error: (error) => {
        console.error('Error adding patient:', error.error);
        alert(`Error: ${error.error?.error || error.message}`);
      },
    });
  }
}