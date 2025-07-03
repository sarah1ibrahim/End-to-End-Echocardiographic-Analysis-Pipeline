import express from 'express';
import { cardiologistSchema } from '../../../databases/models/cardiologists.js';
import {  addPatient, deletePatient, getAssignedPatients, loginCardiologist, updateCardiologist } from './cardiologist.controller.js';
import { verifyToken } from "../../middlewares/verifyToken.js";


const cardiologistRouter =express.Router();

/* 
@desc: Add Cardiologist
@path : cardiologist profile
@method : post 
*/

// cardiologistRouter.post('/cardiologist',addCardiologist)

/* 
@desc: login Cardiologist
@path : cardiologist profile
@method : post 
*/
cardiologistRouter.post('/cardiologist/login',loginCardiologist)




/* 
@desc: show all assigned patients
@path : cardiologist profile
@method : get 
*/

// cardiologistRouter.get('/cardiologist/patients/:id',verifyToken('cardiologist'),getAssignedPatients)
cardiologistRouter.get('/cardiologist/patients/:id',getAssignedPatients)


/* 
@desc: update cardiologits info
@path : cardiologist profile
@method : get 
*/
cardiologistRouter.put('/cardiologist/:id',verifyToken('cardiologist'),updateCardiologist)


/* 
@desc: add patient 
@path : cardiologist profile
@method : post 
*/
cardiologistRouter.post('/cardiologist/addPatient',verifyToken('cardiologist'),addPatient)
// cardiologistRouter.post('/cardiologist/addPatient',addPatient)



/* 
@desc: delete patient 
@path : cardiologist profile
@method : delete 
*/
cardiologistRouter.delete('/cardiologist/:id',deletePatient)


export{
    cardiologistRouter
}