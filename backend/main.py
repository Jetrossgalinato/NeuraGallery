from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import cv2
import numpy as np
import os
from datetime import datetime, timedelta

# Import our auth modules
from auth import (
    fake_users_db, get_password_hash, authenticate_user, 
    create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
)
from models import UserCreate, UserLogin, Token, User

app = FastAPI()

# Security
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    username = verify_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = fake_users_db.get(username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Authentication endpoints
@app.post("/register", response_model=dict)
async def register(user: UserCreate):
    # Check if user already exists
    if user.username in fake_users_db:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # Hash password and store user
    hashed_password = get_password_hash(user.password)
    fake_users_db[user.username] = {
        "id": len(fake_users_db) + 1,
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password
    }
    
    return {"message": "User registered successfully"}

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    # Authenticate user
    authenticated_user = authenticate_user(user.username, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": authenticated_user["username"]}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "email": current_user["email"]
    }

@app.get("/")
def read_root():
    return {"message": "NeuraGallery FastAPI backend running!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "opencv_version": cv2.__version__,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/process-image/")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Save uploaded file
        file_path = os.path.join("uploads", file.filename)
        contents = await file.read()
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Test OpenCV can read the image
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