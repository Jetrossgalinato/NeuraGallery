# NeuraGallery

NeuraGallery is an online AI-powered image gallery desktop application. It allows users to upload images and apply various image processing techniques using a modern UI (Electron.js) and a Python FastAPI backend with OpenCV.

## Project Structure

- `frontend/` — Electron.js desktop app (UI)
- `backend/` — FastAPI + OpenCV backend (Python)

## Setup Instructions

### Prerequisites

- Node.js (for frontend)
- Python 3.8+ (for backend)

---

### 1. Frontend (Electron.js)

```
cd frontend
npm install
npm start
```

---

### 2. Backend (FastAPI + OpenCV)

```
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### 3. Development Workflow

- Start backend first, then frontend.
- The frontend will communicate with the backend via HTTP API.

---

### 4. Contributors

- Lead Developer: [Jetross Axle Galinato]
- Frontend Developer: [Kevin Melendrez]
- Backend Developer: [Christ Gabales]

---

### 5. License

MIT
