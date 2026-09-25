from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from app.models.user import UserCreate, UserResponse, Token, UserInDB
from app.database.mongodb import get_database
from app.services.auth import get_password_hash, verify_password, create_access_token
from app.services.geocoding import geocode_address
from datetime import datetime, timezone

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=201)
async def register_user(user: UserCreate):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    # Check if email exists
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_dict = user.model_dump()
    
    # Geocode address if latitude and longitude are missing but address is provided
    if user.address and not user.latitude and not user.longitude:
        lat, lon = await geocode_address(user.address)
        if lat is not None and lon is not None:
            user_dict["latitude"] = lat
            user_dict["longitude"] = lon
    
    # Hash password
    hashed_password = get_password_hash(user_dict.pop("password"))
    user_dict["password_hash"] = hashed_password
    user_dict["created_at"] = datetime.now(timezone.utc)
    user_dict["is_active"] = True
    
    if user.role == "SHELTER":
        user_dict["current_capacity"] = 0.0
    if user.role == "DRIVER":
        user_dict["is_available"] = True
        
    result = db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    return user_dict

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    user = db.users.find_one({"email": form_data.username})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"], "user_id": str(user["_id"])}
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user["role"],
        "user_id": str(user["_id"])
    }
