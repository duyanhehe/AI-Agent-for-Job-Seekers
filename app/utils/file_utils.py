import os
from fastapi import UploadFile, HTTPException
from app.core.config import ALLOWED_EXTENSIONS


def validate_file(file: UploadFile):
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOC, DOCX files are allowed",
        )
