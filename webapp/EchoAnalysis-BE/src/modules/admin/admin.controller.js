import { cardiologistSchema,cardiologistValidationSchema,cardiologistUpdateSchema } from "../../../databases/models/cardiologists.js";
import {  AdminSchema,adminUpdateSchema,adminValidationSchema} from "../../../databases/models/admin.js";

import dotenv from 'dotenv';
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";
import { patientSchema, patientValidationSchema ,patientUpdateSchema} from "../../../databases/models/patients.js";
// import { AdminSchema } from "../../../databases/models/admin.js";


dotenv.config()

const addAdmin=async(req,res)=>{
  const{email,password}=req.body
  // Generate salt and hash password for security
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newAdmin=await AdminSchema.create({
    email:email,
    password:hashedPassword
  })
  return res.status(200).json({newAdmin})
}

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if admin exists
    const admin = await AdminSchema.findOne({
      where: { email: email },
    });
    if (!admin) {
      return res.status(404).json({ message: "Invalid email or password" });
    }
    // Check if password is correct
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // Generate a JWT token for the admin
    const Token = jwt.sign(
      {
        email:email,
        id:admin.id,
        role:"admin"
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    )
    // Exclude the password field from the admin object before sending the response
    const { password:pws, ...other } = admin.toJSON();
    res.status(200).json({
      message: "Logged in successfully",
      admin: other,
      Token
    });
  } catch (error) {
    return res
      .status(500)
      .json({ 
        message: "Error logging in admin", 
        error: error.message 
    });
  }
};

const addCardiologist = async (req, res) => {
    const {
      email,
      password,
      fname,
      lname,
      Bdate,
      sex,
      phone,
      specialization,
      status,
    } = req.body;
    // Validate request body against schema
    const { error } = cardiologistValidationSchema(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    // Check if user with this email already exists
    let newCardiologist = await cardiologistSchema.findOne({
      where: { email: email },
    });
    if (newCardiologist) {
      return res
        .status(400)
        .json({ message: "Cardiologist with this email already exists" });
    }
  
    // Generate salt and hash password for security
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
  
    // Create new cardiologist object
    try {
      const newCardiologist = await cardiologistSchema.create({
        email: email,
        password: hashedPassword,
        first_name: fname,
        last_name: lname,
        Bdate: Bdate,
        sex: sex,
        phone: phone,
        Specialization: specialization,
        status: status,
      });
      console.log("newCardiologist", newCardiologist);
      console.log("newCardiologist.toJSON()", newCardiologist.toJSON());
  
      const { password, ...other } = newCardiologist.toJSON();
      // toJSON() Converts Instance to Plain Object
      res.status(201).json({
        message: "Cardiologist is created successfully",
        ...other,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error creating cardiologist",
        error: error.message,
      });
    }
  };
  

  const deleteCardiologist=async(req,res)=>{
    const cardiologistId=req.params.id;
    try{
      const cardiologist=await cardiologistSchema.findByPk(cardiologistId);
      if(!cardiologist){
        return res.status(404).json({message:'cardiologist not found'})
      }
      await cardiologist.destroy();
      res.status(200).json({message:'cardiologist deleted successfully'})
    }catch(error){
      return res.status(500).json({message:'error deleting cardiologist',error:error.message})
    }
  }


  const addPatient = async (req, res) => {
    console.log('Received request body:', req.body);
    console.log('req.user:', req.user);
  
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is missing' });
    }
  
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  
    const { fname, lname, Bdate, sex, phone, weight, height,cardiologistId } = req.body;
  
    try {
      console.log('Validating request body...');
      // const { error } = patientValidationSchema(req.body);
      // if (error) {
      //   console.log('Validation error:', error.details[0].message);
      //   return res.status(400).json({ error: error.details[0].message });
      // }
  
      console.log('Creating patient...');
      
      
      const newPatient = await patientSchema.create({
        first_name: fname,
        last_name: lname,
        Bdate: Bdate,
        sex: sex,
        phone: phone,
        cardiologistId: cardiologistId,
        weight: weight,
        height: height
      });
  
      console.log('Patient created:', newPatient);
      return res.status(201).json({
        message: 'Patient created successfully',
        patient: newPatient
      });
    } catch (error) {
      console.error('Error in addPatient:', error);
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          message: `A patient with this phone already exists`,
        });
      }
      return res.status(500).json({
        message: "Error adding patient",
        error: error.message,
      });
    }
  };

  
  // update patient info 
  const updatePatient = async (req, res) => {
    const patientId = req.params.id;
    console.log("patientId",patientId)
    const patient = await patientSchema.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
  
    const { error, value } = patientUpdateSchema(req.body);
    console.log("value", value);
  
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    try {
    
      const updateData = {
        
        first_name: value.fname,
        last_name: value.lname,
        Bdate: value.Bdate,
        sex: value.sex,
        phone: value.phone,
        cardiologistId:value.cardiologistId,
        weight: value.weight,
        height: value.height
      };
  
      const updatedPatient = await patient.update(updateData);
      console.log("updatedPatient", updatedPatient);
  
      const { password, ...other } = patient.toJSON();
  
      res.status(200).json({
        message: "patient updated successfully",
        ...other,
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        const field = error.fields.email ? "email" : "phone";
        return res.status(400).json({
          message: `A patient with this ${field} already exists`,
        });
      }
      res.status(500).json({
        message: "Error updating patient",
        error: error.message,
      });
    }
  };


  

const assignPatientToCardiologist = async (req, res) => {
  
  const patientId = req.params.id;
  console.log("patientId",patientId);
  
  const  {cardiologistId}  = req.body;

  try {
    const patient = await patientSchema.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    let cardiologist = await cardiologistSchema.findOne({
          where: { id: cardiologistId },
        });

    if (!cardiologist) {
      return res.status(404).json({ message: 'Cardiologist not found' });
    }

    // Assigning patient to cardiologist
    await patient.update({ cardiologistId });

    console.log('Patient assigned:', patient);
    return res.status(200).json({
      message: 'Patient assigned to cardiologist successfully',
      patient,
    });
  } catch (error) {
    console.error('Error in assignPatientToCardiologist:', error);
    return res.status(500).json({
      message: 'Error assigning patient to cardiologist',
      error: error.message,
    });
  }
};
  



  export { addCardiologist,deleteCardiologist,loginAdmin,addAdmin,addPatient,updatePatient,assignPatientToCardiologist};