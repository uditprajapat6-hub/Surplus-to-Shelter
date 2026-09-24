from fastapi import APIRouter, HTTPException
from typing import List
from bson import ObjectId
from app.models.shelter import ShelterResponse, ShelterCreate
from app.database.mongodb import get_database
from app.config import settings

router = APIRouter(prefix="/api/shelters", tags=["Shelters"])

# Mock data for Demo Mode
MOCK_SHELTERS = [
    {
        "id": "mock_shelter_1",
        "organization_name": "Hope Shelter",
        "food_needs": ["Cooked meals", "Fruits"],
        "people_served": 50,
        "max_capacity": 100.0,
        "current_capacity": 20.0,
        "latitude": 34.0522,
        "longitude": -118.2437
    },
    {
        "id": "mock_shelter_2",
        "organization_name": "Community Food Bank",
        "food_needs": ["Packaged food", "Vegetables", "Bakery"],
        "people_served": 200,
        "max_capacity": 500.0,
        "current_capacity": 450.0,
        "latitude": 34.0622,
        "longitude": -118.2537
    }
]

@router.get("", response_model=List[ShelterResponse])
async def get_shelters():
    db = get_database()
    if db is not None and not settings.USE_MOCK_DATA:
        cursor = db.shelters.find()
        shelters = []
        for doc in cursor:
            doc["id"] = str(doc["_id"])
            shelters.append(doc)
        return shelters
    return MOCK_SHELTERS

@router.get("/{id}", response_model=ShelterResponse)
async def get_shelter(id: str):
    db = get_database()
    if db is not None and not settings.USE_MOCK_DATA:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid ID format")
        doc = db.shelters.find_one({"_id": ObjectId(id)})
        if doc:
            doc["id"] = str(doc["_id"])
            return doc
        raise HTTPException(status_code=404, detail="Shelter not found")
    else:
        for s in MOCK_SHELTERS:
            if s["id"] == id:
                return s
        raise HTTPException(status_code=404, detail="Shelter not found")
