import express from 'express';
import axios from 'axios';

import { fileUpload,getPresignedUrl,segmentedFileStorage } from '../utils/fileUpolad.js';
import { fileSchema } from '../../databases/models/files.js';
import{patientSchema}from '../../databases/models/patients.js'
import sharp from 'sharp';

import sizeOf from 'image-size';




const fileRouter = express.Router();
let globalOriginalFileName = null;


// Upload image and send to AI service for segmentation
fileRouter.post('/', fileUpload("path"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  

  console.log("Uploaded file:", req.file);
  const orginalFileName = req.file.key;
  globalOriginalFileName = req.file.key;
  const orginalPresignedUrl = await getPresignedUrl(orginalFileName,"original-videos-bucket-123");
  
  console.log("orginalFileName",orginalFileName);
  // Fetch the uploaded image from S3 using the presigned URL
const imageResponse = await axios.get(orginalPresignedUrl, { responseType: 'arraybuffer' });

// Calculate size (width, height) using 'image-size' package
const imageSize = sizeOf(Buffer.from(imageResponse.data));

console.log('Uploaded Image Width:', imageSize.width);
console.log('Uploaded Image Height:', imageSize.height);
  

  try {
    const requestBody = { image_url:  orginalPresignedUrl};
    console.log("Request body being sent to FastAPI:", JSON.stringify(requestBody));

    const aiResponse = await axios.post('http://localhost:8002/segment', requestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    console.log("airespose.data",aiResponse.data);
    
    const segmentedFileName = `segmented_${orginalFileName}`;
    
    segmentedFileStorage(segmentedFileName,aiResponse.data)
    console.log("segmentedImageFile",segmentedFileName);
    
    // Generate pre-signed URL for segmented image
    const segmentedPresignedUrl = await getPresignedUrl(segmentedFileName,"segmented-videos-bucket-123");
    console.log("segmentedPresignedUrl",segmentedPresignedUrl);
    

    //check if patient exist
    // const patient_id=req.body.patientId
    const patient =await patientSchema.findOne({where: {id:req.body.patientId}})
    // const file = await fileSchema.findOne({ where: { patientId: req.params.id } });
    if(!patient){
      res.status(404).json({message:"patient does not exist "})
    }
    else{
      // Save file metadata to database
    const newFileUploaded = await fileSchema.create({
      
      path:req.file.location,
      orginalImageName:orginalFileName, // file name(key) in s3 bucket thi is the orginal vid path i can access
      segmentedImageName: segmentedFileName,
      patientId: req.body.patientId

    });
    res.status(200).json({
      message: 'File uploaded and segmented successfully',
      file: newFileUploaded,
      
      segmentedUrl: segmentedPresignedUrl,
      patient:patient
    });

    }
    

    // // Save file metadata to database
    // const newFileUploaded = await fileSchema.create({
      
    //   path:req.file.location,
    //   orginalImageName:orginalFileName, // file name(key) in s3 bucket thi is the orginal vid path i can access
    //   segmentedImageName: segmentedFileName,
    //   patientId: req.body.patientId
    // });

    // res.status(200).json({
    //   message: 'File uploaded and segmented successfully',
    //   file: newFileUploaded,
      
    //   segmentedUrl: segmentedPresignedUrl
    // });
  } catch (error) {
    console.error("Error processing image with AI service:", error);
    res.status(500).json({ message: 'Error processing image', error: error.message });
  }
});

// Get all files with pre-signed URLs
fileRouter.get("/", async (req, res) => {
  try {
    const files = await fileSchema.findAll();
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        
        const originalUrl = await getPresignedUrl(file.dataValues.orginalImageName,"original-videos-bucket-123");
        console.log("file.dataValues.orginalImageName",file.dataValues.orginalImageName);
        const originalUrl2 = await getPresignedUrl(file.dataValues.newImageName,"original-videos-bucket-123");
        console.log("file.dataValues.originalUrl2",file.dataValues.originalUrl2);
        const segmentedUrl = file.dataValues.segmentedImageName 
          ? await getPresignedUrl(file.dataValues.segmentedImageName,"segmented-videos-bucket-123")
          : null;
        console.log("segmentedUrl",segmentedUrl);

        const segmentedUrl2 = file.dataValues.newSegmentedImageName 
          ? await getPresignedUrl(file.dataValues.newSegmentedImageName,"segmented-videos-bucket-123")
          : null;
        console.log("segmentedUrl2",segmentedUrl2);
        
        return { ...file.dataValues, originalUrl, segmentedUrl };
      })
    );

    res.status(200).json({ message: "Files found", files: filesWithUrls });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ message: "Error fetching files", error: error.message });
  }
});

// Get specific file by patient ID
fileRouter.get('/:id', async (req, res) => {
  try {
    const file = await fileSchema.findOne({ where: { patientId: req.params.id } });
    if (!file) {
      return res.status(404).json({ message: 'Video with specified patient not found' });
    }

    const originalUrl = await getPresignedUrl(file.dataValues.orginalImageName,"original-videos-bucket-123");
    
    
    const segmentedUrl = file.dataValues.segmentedImageName 
      ? await getPresignedUrl(file.dataValues.segmentedImageName,"segmented-videos-bucket-123")
      : null;
    const fileWithUrls = { ...file.dataValues, originalUrl, segmentedUrl };

    res.status(200).json({ message: "File found", file: fileWithUrls });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ message: 'Error fetching file', error: error.message });
  }
});

// Measurement endpoint
fileRouter.post('/measure/:id', fileUpload("path"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No new image uploaded' });
    }

    // Find the file by patient ID
    const file = await fileSchema.findOne({ where: { patientId: req.params.id } });
    if (!file) {
      return res.status(404).json({ message: 'No previous file found for this patient' });
    }

    // Get presigned URL for the previously stored original image
    const originalUrl = await getPresignedUrl(globalOriginalFileName, "original-videos-bucket-123");
    console.log("file.orginalImageName", originalUrl);
    // const originalUrl = await getPresignedUrl(orginalFileName,"original-videos-bucket-123");

    // Handle the newly uploaded image
    const newImageFileName = req.file.key;
    const newImagePresignedUrl = await getPresignedUrl(newImageFileName, "original-videos-bucket-123");
    console.log("file.newImageFileName", newImageFileName);

    // Download both images as buffers
      const [originalImageRes, newImageRes] = await Promise.all([
        axios.get(originalUrl, { responseType: 'arraybuffer' }),
        axios.get(newImagePresignedUrl, { responseType: 'arraybuffer' })
      ]);

      // Calculate image sizes
      const originalImageSize = sizeOf(Buffer.from(originalImageRes.data));
      const newImageSize = sizeOf(Buffer.from(newImageRes.data));

      console.log('Original Image - Width:', originalImageSize.width, 'Height:', originalImageSize.height);
      console.log('New Image - Width:', newImageSize.width, 'Height:', newImageSize.height);
      


    // Send new image for segmentation
    const segmentRequestBody = { image_url: newImagePresignedUrl };
    console.log("Request body being sent for new image segmentation:", JSON.stringify(segmentRequestBody));

    const segmentResponse = await axios.post('http://localhost:8002/segment', segmentRequestBody, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    const newSegmentedFileName = `segmented_${newImageFileName}`;
    segmentedFileStorage(newSegmentedFileName, segmentResponse.data);
    console.log("newSegmentedImageFile", newSegmentedFileName);

    const newSegmentedPresignedUrl = await getPresignedUrl(newSegmentedFileName, "segmented-videos-bucket-123");


    // Step 2: Resize both images to 541x541 using sharp
    // const resizedOriginalBuffer = await sharp(originalImageRes.data)
    //   .resize(541, 541)
    //   .toFormat('png')
    //   .toBuffer();

    // const resizedNewImgBuffer = await sharp(newImageRes.data)
    //   .resize(541, 541)
    //   .toFormat('png')
    //   .toBuffer();

    // Prepare request body for measurement model
    const measurementRequestBody = {
      ed_image_url: originalUrl,
      es_image_url: newImagePresignedUrl,
      patient_id: req.params.id
    };

    console.log("Request body being sent to measurement model:", JSON.stringify(measurementRequestBody));

    // Send request to measurement model
    const measurementResponse = await axios.post('http://localhost:8002/measure', measurementRequestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Extract measurement parameters from response
    const measurementParameters = measurementResponse.data;
    console.log("measurementParameters",measurementParameters)

    // Update file record with measurement parameters, new image name, and new segmented image name
    await fileSchema.update(
      { 
        measurementParameters: measurementParameters,
        newImageName: newImageFileName,
        newSegmentedImageName: newSegmentedFileName
      },
      { where: { patientId: req.params.id } }
    );

    // Fetch updated file record
    const updatedFile = await fileSchema.findOne({ where: { patientId: req.params.id } });

    res.status(200).json({
      message: 'Measurement processed successfully',
      file: updatedFile,
      measurementParameters: measurementParameters,
      newImageUrl: newImagePresignedUrl,
      newSegmentedImageUrl: newSegmentedPresignedUrl
    });

  } catch (error) {
    console.error("Error processing measurement:", error);
    res.status(500).json({ message: 'Error processing measurement', error: error.message });
  }
});

// Generate report for a patient
// fileRouter.get('/report/:id', async (req, res) => {
//   try {
//     // Fetch patient information
//     const patient = await patientSchema.findOne({ where: { id: req.params.id } });
//     if (!patient) {
//       return res.status(404).json({ message: 'Patient not found' });
//     }

//     // Fetch file information (including measurements)
//     const file = await fileSchema.findOne({ where: { patientId: req.params.id } });
//     if (!file) {
//       return res.status(404).json({ message: 'No file found for this patient' });
//     }

//     // Generate pre-signed URLs for original and segmented images
//     // const originalUrl = await getPresignedUrl(file.dataValues.orginalImageName, "original-videos-bucket-123");
//     // const segmentedUrl = file.dataValues.segmentedImageName
//     //   ? await getPresignedUrl(file.dataValues.segmentedImageName, "segmented-videos-bucket-123")
//     //   : null;
//     // const newImageUrl = file.dataValues.newImageName
//     //   ? await getPresignedUrl(file.dataValues.newImageName, "original-videos-bucket-123")
//     //   : null;
//     // const newSegmentedUrl = file.dataValues.newSegmentedImageName
//     //   ? await getPresignedUrl(file.dataValues.newSegmentedImageName, "segmented-videos-bucket-123")
//     //   : null;

//     // Construct report data
//     const reportData = {
//       patient,
//       measurements: file.measurementParameters || {}, // Measurements from fileSchema
//       // fileInfo: {
//       //   originalImageUrl: originalUrl,
//       //   segmentedImageUrl: segmentedUrl,
//       //   newImageUrl: newImageUrl,
//       //   newSegmentedImageUrl: newSegmentedUrl,
//       // },
//     };

//     res.status(200).json({
//       message: 'Report generated successfully',
//       report: reportData,
//     });
//   } catch (error) {
//     console.error('Error generating report:', error);
//     res.status(500).json({ message: 'Error generating report', error: error.message });
//   }
// });

// // Generate report for a patient
// Generate report for a patient
fileRouter.get('/report/:id', async (req, res) => {
  try {
    // Fetch patient information
    const patient = await patientSchema.findOne({ where: { id: req.params.id } });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch file information (including measurements)
    const file = await fileSchema.findOne({ where: { patientId: req.params.id } });
    if (!file) {
      return res.status(404).json({ message: 'No file found for this patient' });
    }

    // Generate pre-signed URLs for original and segmented images
    // const originalUrl = await getPresignedUrl(file.dataValues.orginalImageName, "original-videos-bucket-123");
    // const segmentedUrl = file.dataValues.segmentedImageName
    //   ? await getPresignedUrl(file.dataValues.segmentedImageName, "segmented-videos-bucket-123")
    //   : null;
    // const newImageUrl = file.dataValues.newImageName
    //   ? await getPresignedUrl(file.dataValues.newImageName, "original-videos-bucket-123")
    //   : null;
    // const newSegmentedUrl = file.dataValues.newSegmentedImageName
    //   ? await getPresignedUrl(file.dataValues.newSegmentedImageName, "segmented-videos-bucket-123")
    //   : null;

    // Parse measurements if it's a JSON string
    let measurements = {};
    if (file.measurementParameters) {
      try {
        measurements = typeof file.measurementParameters === 'string'
          ? JSON.parse(file.measurementParameters)
          : file.measurementParameters;
      } catch (e) {
        console.error('Error parsing measurementParameters:', e);
      }
    }

    // Prepare request body for FastAPI /report endpoint
    const reportRequestBody = {
      patient_id: req.params.id.toString(), // Ensure string
      age: parseInt(patient.age, 10) || 52, // Use patient.age, fallback to 52
      sex: patient.sex && typeof patient.sex === 'string' ? patient.sex : "Unknown", // Ensure valid string
      measurements: measurements, // Use parsed measurements
    };

    // Validate required fields
    if (typeof reportRequestBody.age !== 'number' || isNaN(reportRequestBody.age)) {
      return res.status(400).json({ message: 'Invalid or missing age' });
    }
    if (typeof reportRequestBody.sex !== 'string' || reportRequestBody.sex.trim() === '') {
      return res.status(400).json({ message: 'Invalid or missing sex' });
    }
    if (typeof reportRequestBody.measurements !== 'object' || reportRequestBody.measurements === null) {
      return res.status(400).json({ message: 'Invalid or missing measurements' });
    }

    console.log("Request body being sent to FastAPI /report:", JSON.stringify(reportRequestBody));

    // Send request to FastAPI /report endpoint
    const fastApiResponse = await axios.post('http://localhost:8001/report', reportRequestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Construct report data
    const reportData = {
      patient_info: {
        // id: patient.id,
        // age: patient.Bdate,
        // sex: patient.sex,
        // comorbidities: patient.comorbidities || [],
        // Add other relevant patient fields if needed
        // ...patient.dataValues,
        patient
      },
      measurements: measurements, // Use parsed measurements
      // file_info: {
      //   originalImageUrl: originalUrl,
      //   segmentedImageUrl: segmentedUrl,
      //   newImageUrl: newImageUrl,
      //   newSegmentedImageUrl: newSegmentedUrl,
      // },
      clinical_impression: fastApiResponse.data.clinical_impression,
      // clinical_impression: "Clinical Impression:\n\n**Patient:** 52-year-old male\n\n**Chief Complaint (Implied):**  Evaluation of cardiac function.\n\n**Ejection Fraction (EF):** 49% (Mildly reduced)\n\n**End-Diastolic Volume (EDV):** 57 ml\n\n**End-Systolic Volume (ESV):** 85 ml\n\n**Stroke Volume (SV):** -28 ml (This is an abnormal negative value and suggests an error in measurement or calculation.  Further investigation is crucial.)\n\n**Mean Velocity (MV):** 86 ml/min (This value is likely irrelevant to standard echocardiographic reporting and needs clarification.)\n\n**Blood Volume (BV):** 57 ml (This value is implausibly low and suggests an error in measurement or calculation.  Further investigation is crucial.)\n\n**Interpretation:** The reported EF of 49% indicates mildly reduced left ventricular systolic function.  However, the negative stroke volume, implausibly low blood volume, and the unexplained mean velocity raise significant concerns about the accuracy and completeness of the provided echocardiographic data.  **The data requires verification and clarification before a definitive diagnosis can be made.**\n\n\n**Assuming the SV and BV values are erroneous and focusing solely on the EF:**\n\n**Heart Failure Type (Tentative):**  Given the mildly reduced EF, the patient may be experiencing *systolic heart failure* with preserved or mildly reduced ejection fraction (HFmrEF).  However, a definitive classification requires further investigation, including clinical symptoms and signs.\n\n**ACC/AHA Stage (Tentative):**  Without clinical symptoms or signs, and pending confirmation of the echocardiographic data, the patient's ACC/AHA heart failure stage cannot be definitively determined.  However, based solely on the mildly reduced EF, he could potentially be at Stage B (asymptomatic with structural heart disease).\n\n**Contributing Factors (Speculative):** The contributing factors to the reduced EF remain unclear without further clinical information. Possibilities include:\n\n* **Coronary artery disease:**  Requires further investigation via cardiac biomarkers, electrocardiogram (ECG), and coronary angiography.\n* **Valvular heart disease:**  Echocardiography should be reviewed for evidence of valvular dysfunction.\n* **Hypertension:**  Blood pressure measurements and history are needed.\n* **Diabetes mellitus:**  History of diabetes should be reviewed.\n* **Myocarditis:**  History of recent infections, and cardiac biomarkers are needed.\n\n\n**Recommendations:**\n\n1. **Repeat echocardiogram:**  A repeat echocardiogram is absolutely necessary to verify the questionable measurements (SV, BV, MV) and to obtain a complete and accurate assessment of left ventricular function.\n2. **Comprehensive clinical evaluation:**  A thorough clinical evaluation is essential, including:\n    * Detailed medical history (including family history of heart disease).\n    * Physical examination, focusing on cardiac auscultation and assessment for signs of heart failure (e.g., edema, crackles).\n    * ECG to evaluate rhythm and look for evidence of ischemia.\n    * Basic metabolic panel (BMP) and lipid profile.\n    * Cardiac biomarkers (troponin, BNP/NT-proBNP) to assess for myocardial injury or strain.\n    * Consideration for further investigations such as coronary angiography depending on clinical suspicion and ECG findings.\n3. **Lifestyle modifications (if indicated):**  Based on further assessment, lifestyle modifications such as diet, exercise, and smoking cessation may be recommended.\n4. **Medication management (if indicated):**  Depending on the findings of the further investigations, medications may be prescribed to manage blood pressure, cholesterol, and heart failure if indicated.\n\n\n**In summary:** The provided data is incomplete and contains inconsistencies that require urgent clarification.  A thorough re-evaluation is crucial to establish a definitive diagnosis and appropriate management plan."
    };

    res.status(200).json({
      message: 'Report generated successfully',
      report: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});
export { fileRouter };