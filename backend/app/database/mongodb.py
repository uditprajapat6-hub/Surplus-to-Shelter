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
        client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        # Verify connection
        client.admin.command('ping')
        db = client[settings.DATABASE_NAME]
        logger.info(f"Successfully connected to MongoDB. Database: {settings.DATABASE_NAME}")
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

def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")
