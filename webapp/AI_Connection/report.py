from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
from PIL import Image
import io
import numpy as np
import os
import logging
from torchvision import transforms
from pathlib import Path
from typing import Tuple
from skimage.measure import find_contours
import SimpleITK as sitk
from backbones_unet.model.unet import Unet
import google.generativeai as genai
genai.configure(api_key="AIzaSyCWv09QE4hyhDF8RrVoU0cXB4V7j98kF-w")
for model in genai.list_models():
    print(model.name)

# Import Resampling from PIL
try:
    from PIL.Image import Resampling
except ImportError:
    from PIL import Image as Resampling
    logging.warning("Using deprecated Pillow Image resampling constants. Consider upgrading to Pillow >= 10.0.0.")

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Define temporary directory for Windows
TEMP_DIR = "C:/Temp"
os.makedirs(TEMP_DIR, exist_ok=True)  # Create directory if it doesn't exist


# Initialize Google Generative AI client
logger.debug("Initializing Google Generative AI client...")
try:
    genai.configure(api_key="AIzaSyCWv09QE4hyhDF8RrVoU0cXB4V7j98kF-w")
    logger.debug("Google Generative AI configured successfully")
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content("Test prompt: Generate a simple clinical impression for a 65-year-old male with EF 35%.")
    logger.debug(f"Response: {response.text}")
    print(response.text)
except Exception as e:
    logger.error(f"Error: {str(e)}", exc_info=True)
    raise

class ReportRequest(BaseModel):
    patient_id: str
    age: int
    sex: str
    # comorbidities: Optional[list[str]] = []  # Optional, default to empty list
    measurements: dict





@app.post("/report")
async def generate_report(request: ReportRequest):
    logger.debug(f"Received report request for patient {request.patient_id}")
    
    try:
        # Construct prompt for Google Generative AI
        measurements_str = "\n".join([f"- {key}: {value}" for key, value in request.measurements.items()])
        prompt = f"""
Generate a clinical impression for a patient with the following data:

- Age: {request.age} years  
- Sex: {request.sex}  

{measurements_str}

Please format the output using the following structured headings.  
**Start a new line for each heading and its corresponding content.**  
**Leave one blank line between each heading-content pair for readability.**  
**Leave two blank lines between major sections.**

Example formatting:

**End-Diastolic Volume (EDV):**  
Value or interpretation here.

**End-Systolic Volume (ESV):**  
Value or interpretation here.

...

Now use the structure below:

**End-Diastolic Volume (EDV):**  

**End-Systolic Volume (ESV):**  

**Stroke Volume (SV):**  

**Mean Velocity (MV):**  

**Blood Volume (BV):**  


**Interpretation:**  


**Heart Failure Type (Tentative):**  

**ACC/AHA Stage (Tentative):**  


**Summary:**  
Provide a brief yet comprehensive summary highlighting the most critical findings and clinical impression.
"""


#         prompt = f"""
# You are a board-certified cardiologist. 
# The patient is a {request.sex}, aged {request.age} years.
# Based on the provided echocardiographic measurements{measurements_str} and clinical findings, 
# generate a detailed, structured, and formal clinical impression, 
# similar in tone to professional echocardiography reports.
# Include key observations, interpretations, and any notable abnormalities.
# Avoid redundancy but do not overly shorten your response; aim for a complete paragraph or more when appropriate.
# Use precise medical terminology.

# Format the output using the following structured headings:

# **End-Diastolic Volume (EDV):**  
# **End-Systolic Volume (ESV):**  
# **Stroke Volume (SV):**  
# **Mean Velocity (MV):**  
# **Blood Volume (BV):**  
# **Interpretation:**  
# **Heart Failure Type (Tentative):**  
# **ACC/AHA Stage (Tentative):**  

# **Summary:**  
# Provide a brief yet comprehensive summary highlighting the most critical findings and clinical impression.  
# Avoid repeating the patient's demographics or adding unnecessary headings like 'Echocardiographic Report'.

# """


        logger.debug(f"Generated prompt for AI: {prompt}")

        # Initialize Generative Model and generate content
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        clinical_impression = response.text
        logger.debug(f"Clinical impression generated: {clinical_impression}")

        # Construct response
        report_data = {
            "patient_id": request.patient_id,
            "patient_info": {
                "age": request.age,
                "sex": request.sex,
            },
            "measurements": request.measurements,
            "clinical_impression": clinical_impression,
        }

        return report_data

    except Exception as e:
        logger.error(f"Error generating report: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


   

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)