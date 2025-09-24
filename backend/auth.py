
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from database import create_user, get_user_by_username, get_user_by_email

SECRET_KEY = "your-secret-key-here"  # Change this in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(username: str, password: str):
    user = get_user_by_username(username)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        # Print token details for debugging (first few characters)
        print(f"Verifying token: {token[:10]}...")
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Print payload details for debugging
        print(f"Token payload: {payload}")
        
        username: str = payload.get("sub")
        if username is None:
            print("No 'sub' claim found in token")
            return None
            
        # Check expiration manually for more detailed errors
        if "exp" in payload:
            expiry = datetime.fromtimestamp(payload["exp"])
            now = datetime.utcnow()
            if expiry < now:
                print(f"Token expired at {expiry}, current time is {now}")
                return None
        
        return username
    except JWTError as e:
        print(f"JWT Error verifying token: {str(e)}")
        return None
    except Exception as e:
        print(f"Unexpected error verifying token: {str(e)}")
        return None

def register_user(username: str, email: str, password: str):
    if get_user_by_username(username):
        return {"error": "Username already exists"}
    if get_user_by_email(email):
        return {"error": "Email already exists"}
    hashed_password = get_password_hash(password)
    user_id = create_user(username, email, hashed_password)
    return {"message": "User created successfully", "user_id": user_id}