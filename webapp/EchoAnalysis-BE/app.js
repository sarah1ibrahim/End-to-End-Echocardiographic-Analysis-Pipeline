import express from 'express';
import dotenv from 'dotenv';
import { patientSchema } from './databases/models/patients.js';
import { patientRouter } from './src/modules/patients/patients.router.js';
import { fileRouter } from './src/modules/filesupload.router.js';
import { cardiologistRouter } from './src/modules/cardiologists/cardiologist.router.js';
import { adminRouter } from './src/modules/admin/admin.router.js';

import cors from 'cors'
import helmet from 'helmet';





dotenv.config()
// Initialize Express application
const app = express();
app.use(helmet());
app.use(cors())
// Parse JSON request bodies
app.use(express.json());
// to resolve static files
// app.use(express.static('uploads'))

app.use('/uploads',express.static('uploads'))

app.use('/home',patientRouter)
app.use('/fileupload',fileRouter)
app.use('/home',cardiologistRouter)
app.use('/home/admin',adminRouter)

// Set server port
const port = 5000;

// Export the app without starting the server
export default app;

// Start server and listen on specified port
// Start the server only if this file is run directly (not during tests)
// if (import.meta.url === new URL(import.meta.url).href) {
app.listen(port, () => {
    if (process.env.NODE_ENV !== 'test') {
    console.log(`Server is running on port ${port}`);
    console.log(`http://localhost:${port}`);
    }
});
//   }
