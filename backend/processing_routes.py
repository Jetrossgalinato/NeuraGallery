# Image processing endpoints
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from datetime import datetime
import os
import cv2
import numpy as np
from .auth_routes import get_current_user
from models import ImageDimensionsResponse

router = APIRouter()

@router.post("/image/{image_id}/quick-adjust")
async def quick_adjust_image(
	image_id: int, 
	brightness: float = 1.0,
	contrast: float = 1.0,
	saturation: float = 1.0,
	hue_shift: int = 0,
	current_user = Depends(get_current_user)
):
	# ...existing code from main.py...
	try:
		if not (0.3 <= brightness <= 2.0):
			raise HTTPException(status_code=400, detail="Brightness must be between 0.3 and 2.0")
		if not (0.3 <= contrast <= 2.0):
			raise HTTPException(status_code=400, detail="Contrast must be between 0.3 and 2.0")
		if not (0.0 <= saturation <= 2.0):
			raise HTTPException(status_code=400, detail="Saturation must be between 0.0 and 2.0")
		if not (-30 <= hue_shift <= 30):
			raise HTTPException(status_code=400, detail="Hue shift must be between -30 and 30")
		user_images = get_user_images(current_user["id"])
		image_info = next((img for img in user_images if img["id"] == image_id), None)
		if not image_info:
			raise HTTPException(status_code=404, detail="Image not found")
		image_path = os.path.join("uploads", image_info["filename"])
		image = cv2.imread(image_path)
		if image is None:
			raise HTTPException(status_code=400, detail="Unable to read image")
		hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(np.float32)
		hsv_image[:,:,2] = np.clip(hsv_image[:,:,2] * brightness, 0, 255)
		hsv_image[:,:,1] = np.clip(hsv_image[:,:,1] * saturation, 0, 255)
		if hue_shift != 0:
			hsv_image[:,:,0] = (hsv_image[:,:,0] + hue_shift) % 180
		hsv_image = hsv_image.astype(np.uint8)
		processed_image = cv2.cvtColor(hsv_image, cv2.COLOR_HSV2BGR)
		if contrast != 1.0:
			processed_image = cv2.convertScaleAbs(processed_image, alpha=contrast, beta=0)
		base_name = os.path.splitext(image_info["filename"])[0]
		processed_filename = f"{base_name}_adjusted_b{brightness:.1f}_c{contrast:.1f}_s{saturation:.1f}_h{hue_shift}.jpg"
		processed_path = os.path.join("uploads", processed_filename)
		cv2.imwrite(processed_path, processed_image)
		return {
			"success": True,
			"processed_filename": processed_filename,
			"message": "Quick adjustments applied successfully",
			"operation": "quick_adjust",
			"parameters": {
				"brightness": brightness,
				"contrast": contrast,
				"saturation": saturation,
				"hue_shift": hue_shift
			}
		}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# ...repeat for all other image processing endpoints from main.py...
