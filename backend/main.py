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

@app.post("/process-image/")
async def process_image(file: UploadFile = File(...)):
    # Placeholder for image processing logic
    return {"filename": file.filename, "status": "received"}
