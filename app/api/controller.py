from fastapi import APIRouter, UploadFile

router = APIRouter()


@router.post("/upload/cv")
def uploadCV(file: UploadFile):
    pass


@router.post("/upload/job-description")
def uploadJobDescription(file: UploadFile):
    pass


@router.post("/query")
def handleQuery(query: str):
    pass
