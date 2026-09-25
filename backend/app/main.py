from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.routes import donations, shelters, matching, deliveries, impact, auth
import logging

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    connect_to_mongo()
    yield
    # Shutdown
    close_mongo_connection()

app = FastAPI(title="Surplus-to-Shelter API", lifespan=lifespan)

# Include Routers
app.include_router(donations.router)
app.include_router(shelters.router)
app.include_router(matching.router)
app.include_router(deliveries.router)
app.include_router(impact.router)
app.include_router(auth.router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Surplus-to-Shelter API"}
