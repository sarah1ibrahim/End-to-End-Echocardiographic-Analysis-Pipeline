import { patientSchema, patientValidationSchema } from "../../../databases/models/patients.js";

// const addPatient=async(req,res)=>{
//     const{fname,lname,Bdate,sex,phone,weight,height}=req.body 
//        // this is the same name in postman

//     // Validate request body against schema
//     const{error}=patientValidationSchema(req.body)
//     if(error){
//         return res.status(400).json({error:error.details[0].message})
//     }
    
//     // Add patient to the database
//     const newPatient= await patientSchema.create({
//         first_name: fname,
//         last_name: lname,
//         Bdate: Bdate,
//         sex: sex,
//         phone: phone,
//         cardiologistId:req.user.id,
//         weight: weight,
//         height: height
//         // here is the same name in database table 
//     })

//     res.status(201).json({
//         message: 'Patient created successfully',
//         patient:newPatient
//     });
// }

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
  
  

export {
    addPatient
}