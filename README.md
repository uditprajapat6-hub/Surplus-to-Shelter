# Surplus-to-Shelter

"Rescue surplus. Feed communities. Reduce waste."

## Project Description
A comprehensive food rescue and redistribution platform that connects food donors (restaurants, events, supermarkets) with nearby shelters, NGOs, and recipient organizations to reduce food waste and feed those in need.

## Features
- **User Authentication**: Secure Login/Registration for Donors, Shelters, and Drivers using JWT.
- **Donors**: Post surplus food details including quantity, expiry, and type.
- **Shelters**: View available food, accept donations based on their capacity.
- **Drivers**: Dedicated dashboard to get assigned pickups and manage delivery statuses.
- **Matching Engine**: Intelligent matching that recommends the best recipient based on distance, capacity, need, and food expiry.
- **Geocoding & Maps**: Integrated routing and map visualization using OpenStreetMap and Leaflet for efficient deliveries.
- **Impact Dashboard**: Live tracking of meals rescued, CO2 avoided, and overall community impact.

## Architecture
React Frontend -> REST API (FastAPI) -> MongoDB

## Technology Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Leaflet/OpenStreetMap, Recharts, Axios, React Router.
- **Backend**: Python, FastAPI, Uvicorn, PyMongo, JWT Auth, Geocoding.
- **Database**: MongoDB.

## Folder Structure
```
Surplus-to-Shelter/
├── frontend/ (React/Vite app)
└── backend/ (FastAPI app)
```

## Installation Instructions

### Environment Variables
Copy `.env.example` in root, frontend, and backend to `.env` and configure your environment variables:
- `MONGODB_URI`: Your MongoDB connection string.
- `JWT_SECRET`: Secret key for authentication.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv:
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### MongoDB Setup
Ensure MongoDB is running locally or set `MONGODB_URI` to a cloud instance (e.g. Atlas).

## API Overview
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate and get JWT token
- `POST /api/donations` - Create a donation
- `GET /api/donations` - Get active donations
- `POST /api/matching/{donation_id}` - Find optimal matches
- `POST /api/deliveries` - Assign a driver
- `GET /api/dashboard` - Get impact metrics
