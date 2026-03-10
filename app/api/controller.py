from fastapi import APIRouter, File, UploadFile, HTTPException
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
    try:
        context = index_manager.retrieveContext(query)
        query_type = llm_service.detect_query_type(query)
        response = await llm_service.generateResponse(context, query)

        return {
            "query_type": query_type,
            "context_length": len(context),
            "response": response,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
