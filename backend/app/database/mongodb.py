from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize client as None
client = None
db = None

def connect_to_mongo():
    global client, db
    try:
        # We set a low serverSelectionTimeoutMS so it fails fast if MongoDB is not running locally
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000, tz_aware=True)
        # Verify connection
        client.admin.command('ping')
        db = client[settings.DATABASE_NAME]
        logger.info(f"Successfully connected to MongoDB. Database: {settings.DATABASE_NAME}")
        
        # Seed the database with mock shelters if empty
        seed_database()
        
        return True
    except ConnectionFailure:
        logger.warning("Could not connect to MongoDB. Application will need to rely on Mock Data (Demo Mode).")
        client = None
        db = None
        return False
    except Exception as e:
        logger.error(f"An unexpected error occurred while connecting to MongoDB: {e}")
        client = None
        db = None
        return False

def get_database():
    return db

def seed_database():
    if db is None:
        return
    
    # Only seed if shelters collection is empty
    if db.shelters.count_documents({}) == 0:
        logger.info("Seeding MongoDB with initial Shelter data...")
        from app.routes.shelters import MOCK_SHELTERS
        # Convert string 'id' to something MongoDB handles or just store it
        shelters_to_insert = []
        for s in MOCK_SHELTERS:
            shelter_data = s.copy()
            # MongoDB uses _id, so we can let it auto-generate or use ours
            if "id" in shelter_data:
                shelter_data["_id"] = shelter_data["id"]
                del shelter_data["id"] 
            shelters_to_insert.append(shelter_data)
        
        db.shelters.insert_many(shelters_to_insert)
        logger.info("Successfully seeded shelters.")

def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")
