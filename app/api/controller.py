from fastapi import APIRouter, File, UploadFile
import os
from app.services.document_reader import DocumentReader

router = APIRouter()
reader = DocumentReader()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload/cv")
async def uploadCV(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text
    text = reader.readPDF(file_path)

    # DEBUG print
    print("Extracted text:", text[:500])

    return {"filename": file.filename, "text_preview": text[:500]}


@router.post("/upload/job-description")
def uploadJobDescription(file: UploadFile):
    pass


@router.post("/query")
def handleQuery(query: str):
    pass
