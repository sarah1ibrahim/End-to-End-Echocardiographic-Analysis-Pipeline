from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
from PIL import Image
import io
import numpy as np
import torch
import os
import cv2
import logging

from torchvision import transforms
from pathlib import Path
from typing import Tuple
from skimage.measure import find_contours
import SimpleITK as sitk
from backbones_unet.model.unet import Unet

# Import Resampling from PIL
try:
    from PIL.Image import Resampling  # Pillow >= 10.0.0
except ImportError:
    from PIL import Image as Resampling  # Fallback for older Pillow versions
    logging.warning("Using deprecated Pillow Image resampling constants. Consider upgrading to Pillow >= 10.0.0.")

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# Define temporary directory for Windows
TEMP_DIR = "C:/Temp"
os.makedirs(TEMP_DIR, exist_ok=True)  # Create directory if it doesn't exist

# Load the U-Net model
logger.debug("Loading U-Net model...")
try:
    model = Unet(
        backbone='convnext_base',
        in_channels=3,
        num_classes=4,
        pretrained=False  # Disable timm pretrained weights if included in best_model.pth
    )
    model_path = "./models/best_model.pth"  # Update to your actual path
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    model.eval()
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    logger.debug("Model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}", exc_info=True)
    raise

# Define request body schemas
class SegmentRequest(BaseModel):
    image_url: str

class MeasureRequest(BaseModel):
    ed_image_url: str  # Renamed for clarity (end-diastole image)
    es_image_url: str  # Renamed for clarity (end-systole image)
    patient_id: str

# Measurement functions
def resize_image(image: np.ndarray, size: Tuple[int, int], resample: Resampling = Resampling.NEAREST) -> np.ndarray:
    """Resizes the image to the specified dimensions."""
    resized_image = np.array(Image.fromarray(image).resize(size, resample=resample))
    return resized_image

def resize_image_to_isotropic(
    image: np.ndarray, spacing: Tuple[float, float], resample: Resampling = Resampling.NEAREST
) -> np.ndarray:
    """Resizes the image to attain isotropic spacing."""
    scaling = np.array(spacing) / min(spacing)
    new_height, new_width = (np.array(image.shape) * scaling).round().astype(int)
    return resize_image(image, (new_width, new_height), resample=resample), min(spacing)

def compute_volume_area_length_method(
    segmentation: np.ndarray,
    voxelspacing: Tuple[float, float]
) -> float:
    """Compute left ventricle volume using the single-plane area-length method."""
    logger.debug(f"Original segmentation shape: {segmentation.shape}, Data type: {segmentation.dtype}")
    logger.debug(f"Original area in pixels: {np.sum(segmentation)}")

    segmentation, isotropic_spacing = resize_image_to_isotropic(segmentation, voxelspacing)
    logger.debug(f"Resized segmentation shape: {segmentation.shape}, Data type: {segmentation.dtype}")

    area_pixels = np.sum(segmentation)
    logger.debug(f"Area in pixels after resize: {area_pixels}")

    if area_pixels == 0:
        logger.warning("No segmented area found after resizing. Returning volume 0.")
        return 0.0

    area_mm2 = area_pixels * (isotropic_spacing ** 2)

    try:
        contours = find_contours(segmentation.astype(float), 0.5)
        if len(contours) == 0:
            logger.warning("No contours found. Returning volume 0.")
            return 0.0
        contour = contours[0]
    except Exception as e:
        logger.error(f"Error finding contours: {e}. Returning volume 0.")
        return 0.0

    max_length = 0
    for i in range(len(contour)):
        for j in range(i+1, len(contour)):
            length = np.linalg.norm(contour[i] - contour[j]) * isotropic_spacing
            if length > max_length:
                max_length = length

    if max_length == 0:
        logger.warning("Could not calculate proper length. Returning volume 0.")
        return 0.0

    area_m2 = area_mm2 / (1000 * 1000)
    length_m = max_length / 1000
    volume_m3 = (8 * area_m2 * area_m2) / (3 * np.pi * length_m)
    volume_ml = volume_m3 * 1e6

    logger.debug(f"Area: {area_mm2:.2f} mm², Length: {max_length:.2f} mm, Volume: {volume_ml:.2f} ml")
    return round(volume_ml, 1)

def get_image_spacing_from_path(image_path: str) -> Tuple[float, float]:
    """Get pixel spacing from image metadata if available."""
    default_spacing = (0.30799999833106995, 0.30799999833106995)
    logger.debug(f"Using default spacing: {default_spacing}")
    return default_spacing

def predict_segmentation(model, image_path: str, device) -> np.ndarray:
    """Generate segmentation mask using U-Net model."""
    image = Image.open(image_path).convert('RGB')
    original_size = image.size
    transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5])
    ])
    image_tensor = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        output = model(image_tensor)
        pred = torch.argmax(output, dim=1).squeeze(0).cpu().numpy()
    pred_resized = cv2.resize(pred.astype(np.uint8), original_size, interpolation=cv2.INTER_NEAREST)
    return pred_resized

def colorize_mask(mask, class_colors):
    """Convert a mask to RGBA using the defined colormap with transparent background."""
    mask_rgba = np.zeros((*mask.shape, 4), dtype=np.uint8)
    process_order = [1, 2, 3]
    for c in process_order:
        if c not in class_colors:
            continue
        binary_mask = (mask == c).astype(np.uint8)
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        color = class_colors[c]
        cv2.drawContours(mask_rgba, contours, -1, (*color, 255), 3)
    return mask_rgba

def calculate_cardiac_volumes_from_unet(
    model,
    ed_image_path: str,
    es_image_path: str,
    device,
    lv_label: int = 1,
    myo_label: int = 2,  # Added myocardium label
    patient_id: str = "",
) -> dict:
    """Calculate cardiac volumes using U-Net predictions, including SV, MV, and BV."""
    logger.debug("=" * 60)
    logger.debug(f"PROCESSING PATIENT {patient_id}")
    logger.debug("=" * 60)

    ed_spacing = get_image_spacing_from_path(ed_image_path)
    es_spacing = get_image_spacing_from_path(es_image_path)
    ed_pred = predict_segmentation(model, ed_image_path, device)
    es_pred = predict_segmentation(model, es_image_path, device)
    ed_lv_mask = (ed_pred == lv_label).astype(np.uint8)
    es_lv_mask = (es_pred == lv_label).astype(np.uint8)
    edv = int(compute_volume_area_length_method(ed_lv_mask, ed_spacing))
    esv = int(compute_volume_area_length_method(es_lv_mask, es_spacing))
    sv = int(edv - esv)
    mv = 0.0
    if myo_label is not None:
        ed_myo_mask = (ed_pred == myo_label).astype(np.uint8)
        ed_epi_mask = ed_lv_mask | ed_myo_mask
        epi_volume = int(compute_volume_area_length_method(ed_epi_mask, ed_spacing))
        mv = epi_volume - edv if epi_volume > edv else 0.0
    bv = edv
    ef = int(abs(round(100 * (edv - esv) / edv, 1))) if edv > 0 else 0.0

    logger.debug(f"ED LV mask: {np.sum(ed_lv_mask)} pixels")
    logger.debug(f"ES LV mask: {np.sum(es_lv_mask)} pixels")
    logger.debug(f"End-Diastolic Volume (EDV): {edv} ml")
    logger.debug(f"End-Systolic Volume (ESV):  {esv} ml")
    logger.debug(f"Stroke Volume (SV):        {sv} ml")
    logger.debug(f"Myocardial Volume (MV):    {mv} ml")
    logger.debug(f"Blood Volume (BV):         {bv} ml")
    logger.debug(f"Ejection Fraction (EF):     {ef}%")

    interpretation = (
        "Normal" if ef >= 50 else
        "Mildly reduced" if ef >= 40 else
        "Moderately reduced" if ef >= 30 else
        "Severely reduced"
    )

    return {
        "EF": f"{ef:.2f}%",
        "EDV": f"{edv:.2f} ml",
        "ESV": f"{esv:.2f} ml",
        "SV": f"{sv:.2f} ml",
        "MV": f"{mv:.2f} ml",
        "BV": f"{bv:.2f} ml",
        "interpretation": interpretation
    }

@app.post("/segment")
async def segment_image(request: SegmentRequest):
    image_url = request.image_url
    logger.debug(f"Processing image_url: {image_url}")

    try:
        response = requests.get(image_url, timeout=10)
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to download image from {image_url}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Could not download image, status code: {response.status_code}")

    content_type = response.headers.get('Content-Type', 'Unknown')
    if not content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail=f"Response is not an image, Content-Type: {content_type}")

    # Save image temporarily
    filename = os.path.basename(image_url.split('?')[0])
    if filename.endswith('.png'):
        filename = filename[:-4]  # Remove .png
    temp_path = os.path.join(TEMP_DIR, f"temp_{filename}.png")
    with open(temp_path, 'wb') as f:
        f.write(response.content)

    try:
        # Generate segmentationf
        pred_mask = predict_segmentation(model, temp_path, device)
        class_colors = {
            1: (0, 255, 0),  # Green for LV
            2: (0, 0, 255),  # Blue for myocardium
            3: (255, 0, 0),  # Red for other
        }
        # Colorize the mask
        pred_rgba = colorize_mask(pred_mask, class_colors)
        # Load original image
        original_image = cv2.imread(temp_path)
        pred_rgba_resized = cv2.resize(pred_rgba, (original_image.shape[1], original_image.shape[0]))
        original_rgba = cv2.cvtColor(original_image, cv2.COLOR_BGR2BGRA)
        # Overlay
        foreground = pred_rgba_resized.astype(float) / 255
        background = original_rgba.astype(float) / 255
        alpha = foreground[:, :, 3:4]
        result = foreground[:, :, :3] * alpha + background[:, :, :3] * (1 - alpha)
        result = (result * 255).astype(np.uint8)
        # Save overlay
        output_path = os.path.join(TEMP_DIR, f"segmented_overlay_{filename}.png")
        success = cv2.imwrite(output_path, result)
        if not success or not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail=f"Failed to save segmented image to {output_path}")
        logger.debug(f"Segmented overlay image saved to: {output_path}")
        return FileResponse(output_path, media_type="image/png", filename="segmented_image.png")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            logger.debug(f"Removed temporary file: {temp_path}")

@app.post("/measure")
async def measure_images(request: MeasureRequest):
    logger.debug(f"Received measurement request for patient {request.patient_id}")

    try:
        # Download ED image
        ed_response = requests.get(request.ed_image_url, timeout=10)
        logger.debug(f"ed_image_url: {ed_response}")
        if ed_response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Could not download ED image, status code: {ed_response.status_code}")

        # Download ES image
        es_response = requests.get(request.es_image_url, timeout=10)
        logger.debug(f"es_image_url: {es_response}")
        if es_response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Could not download ES image, status code: {es_response.status_code}")

        # Save images temporarily
        ed_path = os.path.join(TEMP_DIR, f"ed_{request.patient_id}.png")
        es_path = os.path.join(TEMP_DIR, f"es_{request.patient_id}.png")

        try:
            with open(ed_path, 'wb') as f:
                f.write(ed_response.content)
            with open(es_path, 'wb') as f:
                f.write(es_response.content)


                

            # Calculate cardiac volumes
            results = calculate_cardiac_volumes_from_unet(
                model=model,
                ed_image_path=ed_path,
                es_image_path=es_path,
                device=device,
                lv_label=1,
                myo_label=2,
                patient_id=request.patient_id
            )
        finally:
            # Clean up temporary files
            for path in [ed_path, es_path]:
                if os.path.exists(path):
                    os.remove(path)
                    logger.debug(f"Removed temporary file: {path}")

        return results

    except Exception as e:
        logger.error(f"Error processing measurement: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing measurement: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)