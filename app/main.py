from fastapi import FastAPI
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from app.api.controller import router
from app.core.dependencies import index_manager


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Startup
    index_manager.indexJobs()
    print("Job index initialized")

    yield

    # Shutdown
    print("Server shutting down")


app = FastAPI(lifespan=lifespan)

app.include_router(router)


@app.get("/")
def root():
    return FileResponse("frontend/index.html")


@app.get("/health")
def health_check():
    return {"status": "running"}
