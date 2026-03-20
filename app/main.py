from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.controller import router
from app.core.dependencies import index_manager
from app.core.database import engine, Base
from app.models.user import User


@asynccontextmanager
async def lifespan(app: FastAPI):

    # ------------------------
    # Startup
    # ------------------------

    # Create DB tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created")
    # Initialize job index
    index_manager.indexJobs()
    print("Job index initialized")

    yield

    # ------------------------
    # Shutdown
    # ------------------------
    print("Server shutting down")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health_check():
    return {"status": "running"}
