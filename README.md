# Surplus-to-Shelter

"Rescue surplus. Feed communities. Reduce waste."

## Project Description
A food rescue and redistribution platform that connects food donors with nearby shelters/NGOs/recipient organizations.

## Features
- **Donors**: Post surplus food.
- **Shelters**: View available food, accept donations based on capacity.
- **Drivers**: Assigned to pick up and deliver food.
- **Matching Engine**: Recommends best recipient based on distance, capacity, need, and expiry.
- **Impact Dashboard**: View meals rescued, CO2 avoided, etc.

## Architecture
React Frontend -> REST API -> FastAPI Backend -> MongoDB

## Technology Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Leaflet/OpenStreetMap, Recharts, Axios, React Router.
- **Backend**: Python, FastAPI, Uvicorn, PyMongo.
- **Database**: MongoDB.

## Folder Structure
```
Surplus-to-Shelter/
├── frontend/ (React/Vite app)
└── backend/ (FastAPI app)
```

## Installation Instructions

### Environment Variables
Copy `.env.example` in root, frontend, and backend to `.env` and fill the variables.

### Frontend Setup
```bash
cd frontend
npm install
```

### Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv:
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

### MongoDB Setup
Ensure MongoDB is running locally or set `MONGODB_URI` to a cloud instance (e.g. Atlas).

### How to run frontend
```bash
cd frontend
npm run dev
```

### How to run backend
```bash
cd backend
uvicorn app.main:app --reload
```

## Git Workflow & Team Responsibilities
- **Team Lead (development branch)**: Integration, testing, overall architecture.
- **Frontend (frontend branch)**: UI/UX, React components, dashboards.
- **Backend (backend branch)**: API endpoints, database models, matching logic.

**Workflow**: 
Features are developed on `frontend` or `backend` branches -> Pull Request to `development` -> Testing -> Merged into `main`.

## API Overview
- `POST /api/donations` - Create a donation
- `GET /api/donations` - Get active donations
- `POST /api/matching/{donation_id}` - Find matches
- `POST /api/deliveries` - Assign a driver
- `GET /api/dashboard` - Get impact metrics
