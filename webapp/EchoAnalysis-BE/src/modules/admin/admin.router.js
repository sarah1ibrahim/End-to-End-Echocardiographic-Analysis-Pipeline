import express from 'express';
import { loginAdmin, addCardiologist, deleteCardiologist, addPatient, updatePatient, assignPatientToCardiologist } from './admin.controller.js';
import { updateCardiologist } from '../cardiologists/cardiologist.controller.js';
import { verifyToken } from '../../middlewares/verifyToken.js';



const adminRouter =express.Router();



/* 
@desc: login admin
@path : admin profile
@method : post
*/
adminRouter.post('/login',loginAdmin)

/* 
@desc: Add cardiologist
@path : admin profile
@method : post
*/
adminRouter.post('/addCardiologists',verifyToken('admin'),addCardiologist)

/* 
@desc: update cardiologist
@path : admin profile
@method : put
*/
adminRouter.put('/cardiologists/:id',verifyToken('admin'),updateCardiologist)

/* 
@desc: delete cardiologist
@path : admin profile
@method : delete
*/

// adminRouter.delete('/cardiologists/:id',verifyToken('admin'),deleteCardiologist)
adminRouter.delete('/cardiologists/:id',deleteCardiologist)

/* 
@desc: add patient 
@path : Admin profile
@method : post 
*/
adminRouter.post('/addPatient',verifyToken('admin'),addPatient)


/* 
@desc: update patient info
@path : Admin profile
@method : post 
*/
adminRouter.put('/updatePatient/:id',updatePatient)
// adminRouter.put('/updatePatient/:id',verifyToken('admin'),updatePatient)


/* 
@desc: assignPatientToCardiologist
@path : Admin profile
@method : post 
*/
adminRouter.post('/patients/assign/:id',verifyToken('admin'),assignPatientToCardiologist)


export {
    adminRouter
}