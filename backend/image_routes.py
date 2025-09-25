# Image upload, retrieval, and deletion endpoints
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from datetime import datetime
import os
from database import create_image, get_user_images, delete_image, delete_multiple_images
from models import ImageResponse, DeleteImagesRequest
from .auth_routes import get_current_user

router = APIRouter()

@router.post("/upload-image", response_model=ImageResponse)
async def upload_image(file: UploadFile = File(...), current_user = Depends(get_current_user)):
	if not file.content_type.startswith("image/"):
		raise HTTPException(status_code=400, detail="File must be an image")
	try:
		import uuid
		file_extension = file.filename.split('.')[-1]
		unique_filename = f"{uuid.uuid4()}.{file_extension}"
		file_path = os.path.join("uploads", unique_filename)
		contents = await file.read()
		with open(file_path, "wb") as f:
			f.write(contents)
		image_id = create_image(
			user_id=current_user["id"],
			filename=unique_filename,
			original_filename=file.filename,
			file_path=file_path,
			file_size=len(contents),
			mime_type=file.content_type
		)
		return {
			"id": image_id,
			"filename": unique_filename,
			"original_filename": file.filename,
			"file_size": len(contents),
			"mime_type": file.content_type,
			"uploaded_at": datetime.now()
		}
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/my-images", response_model=list[ImageResponse])
async def get_my_images(current_user = Depends(get_current_user)):
	images = get_user_images(current_user["id"])
	return [
		{
			"id": img["id"],
			"filename": img["filename"],
			"original_filename": img["original_filename"],
			"file_size": img["file_size"],
			"mime_type": img["mime_type"],
			"uploaded_at": img["uploaded_at"]
		}
		for img in images
	]

@router.delete("/image/{image_id}")
async def delete_single_image(image_id: int, current_user = Depends(get_current_user)):
	try:
		success, result = delete_image(image_id, current_user["id"])
		if not success:
			raise HTTPException(status_code=404, detail=result)
		if os.path.exists(result):
			os.remove(result)
		return {
			"success": True,
			"message": f"Image {image_id} deleted successfully"
		}
	except Exception as e:
		if isinstance(e, HTTPException):
			raise e
		raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

@router.post("/images/delete")
async def delete_multiple_images_endpoint(request: DeleteImagesRequest, current_user = Depends(get_current_user)):
	try:
		if not request.image_ids:
			raise HTTPException(status_code=400, detail="No image IDs provided")
		file_paths, message = delete_multiple_images(request.image_ids, current_user["id"])
		if not file_paths:
			raise HTTPException(status_code=404, detail=message)
		deleted_files = 0
		for path in file_paths:
			if os.path.exists(path):
				os.remove(path)
				deleted_files += 1
		return {
			"success": True,
			"message": f"Successfully deleted {deleted_files} images",
			"deleted_count": deleted_files
		}
	except Exception as e:
		if isinstance(e, HTTPException):
			raise e
		raise HTTPException(status_code=500, detail=f"Error deleting images: {str(e)}")
