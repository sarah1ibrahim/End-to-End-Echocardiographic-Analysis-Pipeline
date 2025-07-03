import multer from "multer";
import multerS3 from "multer-s3"
import { v4 as uuidv4 } from "uuid";
import dotenv from 'dotenv';
import AWS from 'aws-sdk';
import { S3Client } from "@aws-sdk/client-s3";
import path from "path";

dotenv.config()

const s3v3 = new AWS.S3();

// AWS S3 sdk Configuration
const s3 = new S3Client({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});


// Multer middleware for uploading original files to AWS S3
export const fileUpload = (fieldName) => {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: 'original-videos-bucket-123',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const fileName = `${uuidv4()}${ext}`;
        cb(null, fileName);
      },
    }),
    
  }).single(fieldName); 
};

export const segmentedFileStorage = (segmentedFile, body) => {
  return s3v3.upload({
    Bucket: 'segmented-videos-bucket-123',
    Key: segmentedFile,
    Body: body,
    ContentType: 'image/png',
  }).promise();
};
//Generate a pre-signed URL for temporary access
export const getPresignedUrl = async (fileKey,bucketName) => {
  const params = {
    Bucket: bucketName,
    Key: fileKey,
    //the key in  the s3 bucket is th filename i generated using uuid
    
    ResponseContentDisposition: "inline", //this to display file in the browser instead of downloading it 
    Expires: 60 * 10, // URL expires in 10 minutes
  };
  console.log("Generating URL for key:", fileKey);
  console.log("key",path.extname(fileKey));

  try {
    const url = await s3v3.getSignedUrlPromise("getObject", params);
    console.log("Presigned URL:", url);
    return url;
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return null;
  }
};

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: 'original-videos-bucket-123',
//     metadata: (req, file, cb)=> {
//       cb(null, {fieldName: file.fieldname});
//     },
//     key: (req, file, cb)=> {
//       const ext =Path2D.extname(file.originalname);
//       cb(null, `${(uuidv4())}${ext}`)
//     }
//   })
// })


