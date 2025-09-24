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