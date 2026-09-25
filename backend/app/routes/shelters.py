from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from app.models.shelter import ShelterResponse, ShelterCreate
from app.database.mongodb import get_database
from app.config import settings

from app.dependencies import get_current_user

router = APIRouter(prefix="/api/shelters", tags=["Shelters"])

@router.get("", response_model=List[ShelterResponse])
async def get_shelters(current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is not None:
        cursor = db.users.find({"role": "SHELTER"})
        shelters = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            shelters.append(doc)
        return shelters
    raise HTTPException(status_code=500, detail="Database not connected")

@router.get("/{id}", response_model=ShelterResponse)
async def get_shelter(id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is not None:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        doc = db.users.find_one({"_id": ObjectId(id), "role": "SHELTER"})
        if doc:
            doc["id"] = str(doc["_id"])
            return doc
        raise HTTPException(status_code=404, detail="Shelter not found")
    raise HTTPException(status_code=500, detail="Database not connected")
