from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime

class Role(str, Enum):
    DONOR = "DONOR"
    SHELTER = "SHELTER"
    DRIVER = "DRIVER"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Role
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserCreate(UserBase):
    password: str
    
    # Shelter specific
    max_capacity: Optional[float] = None
    food_categories: Optional[list[str]] = None
    
    # Driver specific
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None

class UserInDB(UserBase):
    id: str
    password_hash: str
    created_at: datetime
    is_active: bool = True
    
    # Shelter specific
    max_capacity: Optional[float] = None
    current_capacity: Optional[float] = 0.0
    food_categories: Optional[list[str]] = None
    
    # Driver specific
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    is_available: Optional[bool] = True

class UserResponse(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        populate_by_name = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
