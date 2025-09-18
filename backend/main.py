from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "NeuraGallery FastAPI backend running!"}

@app.post("/process-image/")
async def process_image(file: UploadFile = File(...)):
    # Placeholder for image processing logic
    return {"filename": file.filename, "status": "received"}
