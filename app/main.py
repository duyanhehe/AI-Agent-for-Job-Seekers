from fastapi import FastAPI
from app.api.controller import router

app = FastAPI()
app.include_router(router)


@app.get("/")
def health_check():
    return {"status": "running"}
