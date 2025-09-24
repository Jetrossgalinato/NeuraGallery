from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
import cv2
import numpy as np
import os
from datetime import datetime, timedelta

# Import our auth modules
from auth import (
    register_user, authenticate_user, create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
)
from database import init_database, get_user_by_username, create_image, get_user_images
from models import (
    UserCreate, UserLogin, Token, User, ImageResponse, ImageProcessingRequest, 
    ImageDimensionsResponse, ProcessedImageResponse, HSVAdjustParams, RGBChannelParams, 
    ColorSpaceParams, DrawingParams, TransformParams, ResizeParams, ScaleParams, CropParams
)


app = FastAPI()

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Initialize PostgreSQL database on startup
@app.on_event("startup")
async def startup_event():
    init_database()

# Security
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to get current user from PostgreSQL
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    username = verify_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_username(username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# Authentication endpoints using PostgreSQL
@app.post("/register", response_model=dict)
async def register(user: UserCreate):
    result = register_user(user.username, user.email, user.password)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    authenticated_user = authenticate_user(user.username, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
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

@app.post("/upload-image", response_model=ImageResponse)
async def upload_image(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Generate unique filename
        import uuid
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join("uploads", unique_filename)
        
        # Save file to disk
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Store image info in database
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

@app.get("/my-images", response_model=list[ImageResponse])
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

# Image Processing Endpoints

@app.post("/image/{image_id}/quick-adjust")
async def quick_adjust_image(
    image_id: int, 
    brightness: float = 1.0,
    contrast: float = 1.0,
    saturation: float = 1.0,
    hue_shift: int = 0,
    current_user = Depends(get_current_user)
):
    """Apply multiple quick adjustments in one call - Apple style."""
    try:
        # Validate parameters
        if not (0.3 <= brightness <= 2.0):
            raise HTTPException(status_code=400, detail="Brightness must be between 0.3 and 2.0")
        if not (0.3 <= contrast <= 2.0):
            raise HTTPException(status_code=400, detail="Contrast must be between 0.3 and 2.0")
        if not (0.0 <= saturation <= 2.0):
            raise HTTPException(status_code=400, detail="Saturation must be between 0.0 and 2.0")
        if not (-30 <= hue_shift <= 30):
            raise HTTPException(status_code=400, detail="Hue shift must be between -30 and 30")
        
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load and process image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        # Convert to HSV for saturation and hue adjustments
        hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(np.float32)
        
        # Apply adjustments
        # Brightness and contrast (on value channel)
        hsv_image[:,:,2] = np.clip(hsv_image[:,:,2] * brightness, 0, 255)
        
        # Saturation
        hsv_image[:,:,1] = np.clip(hsv_image[:,:,1] * saturation, 0, 255)
        
        # Hue shift
        if hue_shift != 0:
            hsv_image[:,:,0] = (hsv_image[:,:,0] + hue_shift) % 180
        
        # Convert back to BGR
        hsv_image = hsv_image.astype(np.uint8)
        processed_image = cv2.cvtColor(hsv_image, cv2.COLOR_HSV2BGR)
        
        # Apply contrast adjustment in BGR space
        if contrast != 1.0:
            processed_image = cv2.convertScaleAbs(processed_image, alpha=contrast, beta=0)
        
        # Save processed image
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

@app.get("/image/{image_id}/dimensions", response_model=ImageDimensionsResponse)
async def get_image_dimensions(image_id: int, current_user = Depends(get_current_user)):
    """Get dimensions and basic info about an image."""
    try:
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load image with OpenCV
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        height, width, channels = image.shape
        
        return {
            "width": width,
            "height": height,
            "channels": channels,
            "total_pixels": width * height
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading image: {str(e)}")

@app.post("/image/{image_id}/grayscale")
async def convert_to_grayscale(image_id: int, current_user = Depends(get_current_user)):
    """Convert image to grayscale."""
    try:
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load and process image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        # Convert to grayscale
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Save processed image
        base_name = os.path.splitext(image_info["filename"])[0]
        processed_filename = f"{base_name}_grayscale.jpg"
        processed_path = os.path.join("uploads", processed_filename)
        
        cv2.imwrite(processed_path, gray_image)
        
        return {
            "success": True,
            "processed_filename": processed_filename,
            "message": "Image converted to grayscale successfully",
            "operation": "grayscale",
            "parameters": {}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/image/{image_id}/rgb-channel")
async def extract_rgb_channel(image_id: int, channel: str, current_user = Depends(get_current_user)):
    """Extract specific RGB channel (red, green, blue) or show all channels."""
    try:
        if channel not in ['red', 'green', 'blue', 'all']:
            raise HTTPException(status_code=400, detail="Channel must be 'red', 'green', 'blue', or 'all'")
        
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        # Convert BGR to RGB (OpenCV uses BGR by default)
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        base_name = os.path.splitext(image_info["filename"])[0]
        
        if channel == 'all':
            # Create separate images for each channel
            r_channel = np.zeros_like(image_rgb)
            g_channel = np.zeros_like(image_rgb)
            b_channel = np.zeros_like(image_rgb)
            
            r_channel[:,:,0] = image_rgb[:,:,0]  # Red channel
            g_channel[:,:,1] = image_rgb[:,:,1]  # Green channel
            b_channel[:,:,2] = image_rgb[:,:,2]  # Blue channel
            
            # Save all channels
            for ch, img, name in [('red', r_channel, 'red'), ('green', g_channel, 'green'), ('blue', b_channel, 'blue')]:
                filename = f"{base_name}_{name}_channel.jpg"
                filepath = os.path.join("uploads", filename)
                cv2.imwrite(filepath, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
            
            return {
                "success": True,
                "processed_filename": f"{base_name}_all_channels",
                "message": "All RGB channels extracted successfully",
                "operation": "rgb_channel",
                "parameters": {"channel": "all"}
            }
        else:
            # Extract single channel
            channel_image = np.zeros_like(image_rgb)
            channel_idx = {'red': 0, 'green': 1, 'blue': 2}[channel]
            channel_image[:,:,channel_idx] = image_rgb[:,:,channel_idx]
            
            # Save processed image
            processed_filename = f"{base_name}_{channel}_channel.jpg"
            processed_path = os.path.join("uploads", processed_filename)
            cv2.imwrite(processed_path, cv2.cvtColor(channel_image, cv2.COLOR_RGB2BGR))
            
            return {
                "success": True,
                "processed_filename": processed_filename,
                "message": f"{channel.capitalize()} channel extracted successfully",
                "operation": "rgb_channel",
                "parameters": {"channel": channel}
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/image/{image_id}/hsv-adjust")
async def adjust_hsv(image_id: int, hue_shift: int = 0, saturation_scale: float = 1.0, value_scale: float = 1.0, current_user = Depends(get_current_user)):
    """Adjust Hue, Saturation, and Value of an image."""
    try:
        # Validate parameters
        if not (-180 <= hue_shift <= 180):
            raise HTTPException(status_code=400, detail="Hue shift must be between -180 and 180")
        if not (0.0 <= saturation_scale <= 2.0):
            raise HTTPException(status_code=400, detail="Saturation scale must be between 0.0 and 2.0")
        if not (0.0 <= value_scale <= 2.0):
            raise HTTPException(status_code=400, detail="Value scale must be between 0.0 and 2.0")
        
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load and process image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        # Convert to HSV
        hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV).astype(np.float32)
        
        # Adjust Hue (add/subtract degrees, wrap around)
        hsv_image[:,:,0] = (hsv_image[:,:,0] + hue_shift) % 180
        
        # Adjust Saturation
        hsv_image[:,:,1] = np.clip(hsv_image[:,:,1] * saturation_scale, 0, 255)
        
        # Adjust Value (brightness)
        hsv_image[:,:,2] = np.clip(hsv_image[:,:,2] * value_scale, 0, 255)
        
        # Convert back to BGR and uint8
        hsv_image = hsv_image.astype(np.uint8)
        processed_image = cv2.cvtColor(hsv_image, cv2.COLOR_HSV2BGR)
        
        # Save processed image
        base_name = os.path.splitext(image_info["filename"])[0]
        processed_filename = f"{base_name}_hsv_h{hue_shift}_s{saturation_scale:.1f}_v{value_scale:.1f}.jpg"
        processed_path = os.path.join("uploads", processed_filename)
        
        cv2.imwrite(processed_path, processed_image)
        
        return {
            "success": True,
            "processed_filename": processed_filename,
            "message": "HSV adjustment applied successfully",
            "operation": "hsv_adjust",
            "parameters": {
                "hue_shift": hue_shift,
                "saturation_scale": saturation_scale,
                "value_scale": value_scale
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/image/{image_id}/colorspace")
async def convert_colorspace(image_id: int, target_space: str, current_user = Depends(get_current_user)):
    """Convert image to different color spaces (HSV, LAB, YUV, GRAY)."""
    try:
        valid_spaces = ['HSV', 'LAB', 'YUV', 'GRAY']
        if target_space not in valid_spaces:
            raise HTTPException(status_code=400, detail=f"Target space must be one of: {valid_spaces}")
        
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        # Convert to target color space
        conversion_map = {
            'HSV': cv2.COLOR_BGR2HSV,
            'LAB': cv2.COLOR_BGR2LAB,
            'YUV': cv2.COLOR_BGR2YUV,
            'GRAY': cv2.COLOR_BGR2GRAY
        }
        
        if target_space == 'GRAY':
            processed_image = cv2.cvtColor(image, conversion_map[target_space])
        else:
            processed_image = cv2.cvtColor(image, conversion_map[target_space])
        
        # Save processed image
        base_name = os.path.splitext(image_info["filename"])[0]
        processed_filename = f"{base_name}_{target_space.lower()}.jpg"
        processed_path = os.path.join("uploads", processed_filename)
        
        cv2.imwrite(processed_path, processed_image)
        
        return {
            "success": True,
            "processed_filename": processed_filename,
            "message": f"Image converted to {target_space} color space successfully",
            "operation": "colorspace",
            "parameters": {"target_space": target_space}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Advanced Editing Endpoints

@app.post("/image/{image_id}/draw")
async def draw_on_image(
    image_id: int,
    shape_type: str,
    start_x: int,
    start_y: int,
    end_x: int = None,
    end_y: int = None,
    radius: int = None,
    color_r: int = 255,
    color_g: int = 255, 
    color_b: int = 255,
    thickness: int = 2,
    text: str = None,
    font_size: float = 1.0,
    current_user = Depends(get_current_user)
):
    """Draw shapes or text on an image using OpenCV."""
    try:
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        # Draw based on shape type
        color = (color_b, color_g, color_r)  # OpenCV uses BGR format
        
        if shape_type == "line" and end_x is not None and end_y is not None:
            cv2.line(image, (start_x, start_y), (end_x, end_y), color, thickness)
        elif shape_type == "rectangle" and end_x is not None and end_y is not None:
            cv2.rectangle(image, (start_x, start_y), (end_x, end_y), color, thickness)
        elif shape_type == "circle" and radius is not None:
            cv2.circle(image, (start_x, start_y), radius, color, thickness)
        elif shape_type == "text" and text is not None:
            font = cv2.FONT_HERSHEY_SIMPLEX
            cv2.putText(image, text, (start_x, start_y), font, font_size, color, thickness)
        else:
            raise HTTPException(status_code=400, detail="Invalid shape type or missing parameters")
        
        # Save processed image
        base_name = os.path.splitext(image_info["filename"])[0]
        processed_filename = f"{base_name}_draw_{shape_type}.jpg"
        processed_path = os.path.join("uploads", processed_filename)
        
        cv2.imwrite(processed_path, image)
        
        return {
            "success": True,
            "processed_filename": processed_filename,
            "message": f"{shape_type.capitalize()} drawn successfully",
            "operation": "draw",
            "parameters": {
                "shape_type": shape_type,
                "start_point": [start_x, start_y],
                "end_point": [end_x, end_y] if end_x is not None else None,
                "radius": radius,
                "color": [color_r, color_g, color_b],
                "thickness": thickness,
                "text": text,
                "font_size": font_size
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error drawing on image: {str(e)}")

@app.post("/image/{image_id}/transform")
async def transform_image(
    image_id: int,
    operation: str,
    tx: float = 0,
    ty: float = 0,
    angle: float = 0,
    center_x: float = None,
    center_y: float = None,
    current_user = Depends(get_current_user)
):
    """Apply geometric transformations (translate, rotate) to an image."""
    try:
        if operation not in ['translate', 'rotate']:
            raise HTTPException(status_code=400, detail="Operation must be 'translate' or 'rotate'")
        
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        height, width = image.shape[:2]
        
        if operation == "translate":
            # Translation matrix
            M = np.float32([[1, 0, tx], [0, 1, ty]])
            transformed_image = cv2.warpAffine(image, M, (width, height))
        elif operation == "rotate":
            # Rotation matrix
            if center_x is None:
                center_x = width // 2
            if center_y is None:
                center_y = height // 2
            
            M = cv2.getRotationMatrix2D((center_x, center_y), angle, 1.0)
            transformed_image = cv2.warpAffine(image, M, (width, height))
        
        # Save processed image
        base_name = os.path.splitext(image_info["filename"])[0]
        processed_filename = f"{base_name}_{operation}_{tx}_{ty}_{angle}.jpg"
        processed_path = os.path.join("uploads", processed_filename)
        
        cv2.imwrite(processed_path, transformed_image)
        
        return {
            "success": True,
            "processed_filename": processed_filename,
            "message": f"Image {operation} applied successfully",
            "operation": "transform",
            "parameters": {
                "operation": operation,
                "tx": tx,
                "ty": ty,
                "angle": angle,
                "center": [center_x, center_y] if operation == "rotate" else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transforming image: {str(e)}")

@app.post("/image/{image_id}/resize")
async def resize_image(
    image_id: int,
    width: int,
    height: int,
    interpolation: str = "linear",
    current_user = Depends(get_current_user)
):
    """Resize an image with different interpolation methods."""
    try:
        # Validate interpolation method
        interpolation_methods = {
            "nearest": cv2.INTER_NEAREST,
            "linear": cv2.INTER_LINEAR,
            "cubic": cv2.INTER_CUBIC,
            "lanczos": cv2.INTER_LANCZOS4
        }
        
        if interpolation not in interpolation_methods:
            raise HTTPException(status_code=400, detail=f"Interpolation must be one of: {list(interpolation_methods.keys())}")
        
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        # Resize image
        resized_image = cv2.resize(image, (width, height), interpolation=interpolation_methods[interpolation])
        
        # Save processed image
        base_name = os.path.splitext(image_info["filename"])[0]
        processed_filename = f"{base_name}_resized_{width}x{height}_{interpolation}.jpg"
        processed_path = os.path.join("uploads", processed_filename)
        
        cv2.imwrite(processed_path, resized_image)
        
        return {
            "success": True,
            "processed_filename": processed_filename,
            "message": f"Image resized to {width}x{height} with {interpolation} interpolation",
            "operation": "resize",
            "parameters": {
                "width": width,
                "height": height,
                "interpolation": interpolation
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resizing image: {str(e)}")

@app.post("/image/{image_id}/scale")
async def scale_image(
    image_id: int,
    scale_x: float = 1.0,
    scale_y: float = 1.0,
    interpolation: str = "linear",
    current_user = Depends(get_current_user)
):
    """Scale an image by scale factors."""
    try:
        # Validate parameters
        if scale_x <= 0 or scale_y <= 0:
            raise HTTPException(status_code=400, detail="Scale factors must be positive")
        
        interpolation_methods = {
            "nearest": cv2.INTER_NEAREST,
            "linear": cv2.INTER_LINEAR,
            "cubic": cv2.INTER_CUBIC,
            "lanczos": cv2.INTER_LANCZOS4
        }
        
        if interpolation not in interpolation_methods:
            raise HTTPException(status_code=400, detail=f"Interpolation must be one of: {list(interpolation_methods.keys())}")
        
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        # Scale image
        scaled_image = cv2.resize(image, None, fx=scale_x, fy=scale_y, interpolation=interpolation_methods[interpolation])
        
        # Save processed image
        base_name = os.path.splitext(image_info["filename"])[0]
        processed_filename = f"{base_name}_scaled_{scale_x}x{scale_y}_{interpolation}.jpg"
        processed_path = os.path.join("uploads", processed_filename)
        
        cv2.imwrite(processed_path, scaled_image)
        
        return {
            "success": True,
            "processed_filename": processed_filename,
            "message": f"Image scaled by {scale_x}x{scale_y} with {interpolation} interpolation",
            "operation": "scale",
            "parameters": {
                "scale_x": scale_x,
                "scale_y": scale_y,
                "interpolation": interpolation
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error scaling image: {str(e)}")

@app.post("/image/{image_id}/crop")
async def crop_image(
    image_id: int,
    x: int,
    y: int,
    width: int,
    height: int,
    current_user = Depends(get_current_user)
):
    """Crop an image to specified coordinates and dimensions."""
    try:
        # Validate parameters
        if width <= 0 or height <= 0:
            raise HTTPException(status_code=400, detail="Width and height must be positive")
        if x < 0 or y < 0:
            raise HTTPException(status_code=400, detail="Coordinates must be non-negative")
        
        # Get image from database
        user_images = get_user_images(current_user["id"])
        image_info = next((img for img in user_images if img["id"] == image_id), None)
        
        if not image_info:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Load image
        image_path = os.path.join("uploads", image_info["filename"])
        image = cv2.imread(image_path)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Unable to read image")
        
        img_height, img_width = image.shape[:2]
        
        # Validate crop boundaries
        if x + width > img_width or y + height > img_height:
            raise HTTPException(status_code=400, detail="Crop area exceeds image boundaries")
        
        # Crop image
        cropped_image = image[y:y+height, x:x+width]
        
        # Save processed image
        base_name = os.path.splitext(image_info["filename"])[0]
        processed_filename = f"{base_name}_cropped_{x}_{y}_{width}x{height}.jpg"
        processed_path = os.path.join("uploads", processed_filename)
        
        cv2.imwrite(processed_path, cropped_image)
        
        return {
            "success": True,
            "processed_filename": processed_filename,
            "message": f"Image cropped to {width}x{height} at position ({x}, {y})",
            "operation": "crop",
            "parameters": {
                "x": x,
                "y": y,
                "width": width,
                "height": height
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cropping image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)