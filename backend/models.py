from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    email: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: int
    username: str
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ImageResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: int
    mime_type: str
    uploaded_at: datetime

# Image Processing Models
class ImageDimensionsResponse(BaseModel):
    width: int
    height: int
    channels: int
    total_pixels: int

class ImageProcessingRequest(BaseModel):
    image_id: int
    operation: str  # 'grayscale', 'rgb_channel', 'hsv_adjust', 'colorspace'
    parameters: dict = {}

class HSVAdjustParams(BaseModel):
    hue_shift: int = 0        # -180 to 180
    saturation_scale: float = 1.0  # 0.0 to 2.0
    value_scale: float = 1.0  # 0.0 to 2.0

class RGBChannelParams(BaseModel):
    channel: str  # 'red', 'green', 'blue', 'all'

class ColorSpaceParams(BaseModel):
    target_space: str  # 'HSV', 'LAB', 'YUV', 'GRAY'

class ProcessedImageResponse(BaseModel):
    success: bool
    processed_filename: Optional[str] = None
    message: str
    operation: str
    parameters: dict = {}

# Advanced Editing Models
class DrawingParams(BaseModel):
    shape_type: str  # 'line', 'rectangle', 'circle', 'text'
    start_point: tuple[int, int]
    end_point: Optional[tuple[int, int]] = None
    radius: Optional[int] = None
    color: tuple[int, int, int] = (255, 255, 255)  # BGR format
    thickness: int = 2
    text: Optional[str] = None
    font_size: float = 1.0

class TransformParams(BaseModel):
    operation: str  # 'translate', 'rotate'
    tx: Optional[float] = 0  # Translation X
    ty: Optional[float] = 0  # Translation Y
    angle: Optional[float] = 0  # Rotation angle in degrees
    center_x: Optional[float] = None  # Rotation center X
    center_y: Optional[float] = None  # Rotation center Y

class ResizeParams(BaseModel):
    width: int
    height: int
    interpolation: str = 'linear'  # 'nearest', 'linear', 'cubic', 'lanczos'

class ScaleParams(BaseModel):
    scale_x: float = 1.0
    scale_y: float = 1.0
    interpolation: str = 'linear'

class CropParams(BaseModel):
    x: int  # Top-left x coordinate
    y: int  # Top-left y coordinate
    width: int  # Crop width
    height: int  # Crop height