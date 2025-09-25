# Authentication-related endpoints and helper logic
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import timedelta
from auth import (
	register_user, authenticate_user, create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
)
from database import get_user_by_username
from models import UserCreate, UserLogin, Token, User

router = APIRouter()

# Security
security = HTTPBearer()

# Helper function to get current user from PostgreSQL
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
	token = credentials.credentials
	print(f"Token received: {token[:10]}...")  # Print first 10 chars for security
	username = verify_token(token)
	print(f"Username from token: {username}")
	if username is None:
		print("Token verification failed")
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid authentication credentials",
			headers={"WWW-Authenticate": "Bearer"},
		)
	user = get_user_by_username(username)
	if user is None:
		print(f"User not found for username: {username}")
		raise HTTPException(status_code=404, detail="User not found")
	print(f"User authenticated: {user['username']}")
	return user

# Authentication endpoints using PostgreSQL
@router.post("/register", response_model=dict)
async def register(user: UserCreate):
	result = register_user(user.username, user.email, user.password)
	if "error" in result:
		raise HTTPException(status_code=400, detail=result["error"])
	return result

@router.post("/login", response_model=Token)
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

@router.get("/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
	return {
		"id": current_user["id"],
		"username": current_user["username"],
		"email": current_user["email"]
	}
