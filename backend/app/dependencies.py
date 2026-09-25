from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.services.auth import SECRET_KEY, ALGORITHM
from app.database.mongodb import get_database
from bson import ObjectId

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    if not ObjectId.is_valid(user_id):
        raise credentials_exception
        
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
        
    user["id"] = str(user["_id"])
    return user

async def get_current_donor(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "DONOR":
        raise HTTPException(status_code=403, detail="Not authorized as Donor")
    return current_user

async def get_current_shelter(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "SHELTER":
        raise HTTPException(status_code=403, detail="Not authorized as Shelter")
    return current_user

async def get_current_driver(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "DRIVER":
        raise HTTPException(status_code=403, detail="Not authorized as Driver")
    return current_user
