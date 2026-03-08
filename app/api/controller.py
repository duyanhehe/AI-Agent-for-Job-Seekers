from fastapi import APIRouter, File, UploadFile
import os
from app.services.document_reader import DocumentReader
from app.services.llm_service import LLMService
from app.services.index_manager import IndexManager
from app.storage.vector_store import VectorStore
from app.config import UPLOAD_DIR, CHROMA_DIR

router = APIRouter()
reader = DocumentReader()
vector_store = VectorStore(CHROMA_DIR)
index_manager = IndexManager()
llm_service = LLMService()


@router.post("/upload/cv")
async def uploadCV(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text
    text = reader.read(file_path)

    # Add to vector index
    index_manager.createEmbeddings(text)
    index_manager.buildIndex()

    return {
        "filename": file.filename,
        "message": "CV uploaded and indexed successfully",
    }


@router.post("/upload/job-description")
async def uploadJobDescription(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename

    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text
    text = reader.read(file_path)

    # Add to vector index
    index_manager.createEmbeddings(text)

    return {"message": "Job description uploaded and indexed"}


@router.post("/query")
async def handleQuery(query: str):
    # Retrieve context
    context = index_manager.retrieveContext(query)

    # Send to LLM
    response = await llm_service.generateResponse(context, query)

    return {"response": response}
