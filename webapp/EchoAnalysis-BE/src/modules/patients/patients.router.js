import express from 'express';
import { patientSchema } from '../../../databases/models/patients.js';
import { addPatient } from './patients.controller.js';


const patientRouter =express.Router();

patientRouter.post('/patient',addPatient)

export{
    patientRouter,
}
