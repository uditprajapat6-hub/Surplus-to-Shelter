from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "surplus_to_shelter"
    
    # We will use this flag later to toggle demo mode
    USE_MOCK_DATA: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
