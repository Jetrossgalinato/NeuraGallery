from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import os
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

@app.get("/")
async def root():
    return {
        "message": "NeuraGallery Backend API", 
        "version": "1.0.0", 
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "opencv_version": cv2.__version__,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Basic image upload endpoint"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Save uploaded file
        file_path = os.path.join("uploads", file.filename)
        contents = await file.read()
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Test OpenCV if it can read the image
        image = cv2.imread(file_path)
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        height, width, channels = image.shape
        
        return JSONResponse({
            "message": "Image uploaded successfully",
            "filename": file.filename,
            "size": f"{width}x{height}",
            "channels": channels,
            "path": f"/uploads/{file.filename}"
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)