import {
  cardiologistSchema,
  cardiologistUpdateSchema,
} from "../../../databases/models/cardiologists.js";
import dotenv from 'dotenv';
import bcrypt from "bcrypt";
import { patientSchema,patientValidationSchema } from "../../../databases/models/patients.js";
import jwt from "jsonwebtoken"
import { verifyToken } from "../../middlewares/verifyToken.js";





dotenv.config()

// const addCardiologist = async (req, res) => {
//   const {
//     email,
//     password,
//     fname,
//     lname,
//     Bdate,
//     sex,
//     phone,
//     specialization,
//     status,
//   } = req.body;
//   // Validate request body against schema
//   const { error } = cardiologistValidationSchema(req.body);
//   if (error) {
//     return res.status(400).json({ error: error.details[0].message });
//   }

//   // Check if user with this email already exists
//   let newCardiologist = await cardiologistSchema.findOne({
//     where: { email: email },
//   });
//   if (newCardiologist) {
//     return res
//       .status(400)
//       .json({ message: "Cardiologist with this email already exists" });
//   }

//   // Generate salt and hash password for security
//   const salt = await bcrypt.genSalt(10);
//   const hashedPassword = await bcrypt.hash(password, salt);

//   // Create new cardiologist object
//   try {
//     const newCardiologist = await cardiologistSchema.create({
//       email: email,
//       password: hashedPassword,
//       first_name: fname,
//       last_name: lname,
//       Bdate: Bdate,
//       sex: sex,
//       phone: phone,
//       Specialization: specialization,
//       status: status,
//     });
//     console.log("newCardiologist", newCardiologist);
//     console.log("newCardiologist.toJSON()", newCardiologist.toJSON());

//     const { password, ...other } = newCardiologist.toJSON();
//     // toJSON() Converts Instance to Plain Object
//     res.status(201).json({
//       message: "Cardiologist is created successfully",
//       ...other,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Error creating cardiologist",
//       error: error.message,
//     });
//   }
// };


const loginCardiologist = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if cardiologist exists
    const cardiologist = await cardiologistSchema.findOne({
      where: { email: email },
    });
    if (!cardiologist) {
      return res.status(404).json({ message: "Invalid email or password" });
    }
    // Check if password is correct
    const isMatch = await bcrypt.compare(password, cardiologist.password);
    if (!isMatch) {
      return res.status(404).json({ message: "Invalid email or password" });
    }
    // Generate a JWT token for the cardiologist
    const Token = jwt.sign(
      {
        email:email,
        id:cardiologist.id,
        role:"cardiologist"
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    )
    // Exclude the password field from the cardiologist object before sending the response
    const { password:pws, ...other } = cardiologist.toJSON();
    res.status(200).json({
      message: "Logged in successfully",
      cardiologist: other,
      Token
    });
  } catch (error) {
    return res
      .status(500)
      .json({ 
        message: "Error logging in cardiologist", 
        error: error.message 
    });
  }
};

const getAssignedPatients = async (req, res) => {
  const cardiologistId = req.params.id;
  // const cardiologistId = req.user.id;

  
  
  // Check if cardiologist exists
  let cardiologist = await cardiologistSchema.findByPk(cardiologistId);
  if (!cardiologist) {
    return res.status(404).json({ message: "Cardiologist not found" });
  }
  // Get assigned patients
  const assignedPatients = await patientSchema.findAll({
    where: { cardiologistId: cardiologistId },
  });
  if(assignedPatients.length === 0){
    return res.status(404).json({ message: "No patients assigned to this cardiologist" });
  }
  console.log("assignedPatients", assignedPatients);

  res
    .status(200)
    .json({ message: "Assigned Patients", patients: assignedPatients });
};

// update cardiologist info 
const updateCardiologist = async (req, res) => {
  const cardiologistId = req.params.id;
  const cardiologist = await cardiologistSchema.findByPk(cardiologistId);
  if (!cardiologist) {
    return res.status(404).json({ message: "Cardiologist not found" });
  }

  const { error, value } = cardiologistUpdateSchema(req.body);
  console.log("value", value);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    if (value.password) {
      value.password = await bcrypt.hash(value.password, 10);
    }

    const updateData = {
      email: value.email,
      password: value.password,
      first_name: value.fname,
      last_name: value.lname,
      Bdate: value.Bdate,
      sex: value.sex,
      phone: value.phone,
      Specialization: value.Specialization,
      status: value.status,
    };

    const updatedCardiologist = await cardiologist.update(updateData);
    console.log("updatedCardiologist", updatedCardiologist);

    const { password, ...other } = cardiologist.toJSON();

    res.status(200).json({
      message: "Cardiologist updated successfully",
      ...other,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.fields.email ? "email" : "phone";
      return res.status(400).json({
        message: `A cardiologist with this ${field} already exists`,
      });
    }
    res.status(500).json({
      message: "Error updating cardiologist",
      error: error.message,
    });
  }
};


const addPatient = async (req, res) => {
  console.log('Received request body:', req.body);
  console.log('req.user:', req.user);

  if (!req.body) {
    return res.status(400).json({ message: 'Request body is missing' });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }

  const { fname, lname, Bdate, sex, phone, weight, height } = req.body;

  try {
    console.log('Validating request body...');
    const { error } = patientValidationSchema(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    console.log('Creating patient...');
    
    
    const newPatient = await patientSchema.create({
      first_name: fname,
      last_name: lname,
      Bdate: Bdate,
      sex: sex,
      phone: phone,
      cardiologistId: req.user.id,
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





const deletePatient = async (req, res) => {
  const patientId = req.params.id;
  const patient = await patientSchema.findByPk(patientId);
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  try {
    await patient.destroy();
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting patient",
      error: error.message,
    });
  }
};



export {
    getAssignedPatients, 
    updateCardiologist,
    loginCardiologist ,
    addPatient,
    deletePatient
  };
