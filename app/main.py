from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from app.api.router import router
from app.core.dependencies import index_manager
from app.core.database import engine, Base
import logging
import json

logging.basicConfig(level=logging.INFO)

logging.getLogger("httpx").propagate = False
logging.getLogger("huggingface_hub").propagate = False
logging.getLogger("transformers").propagate = False


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


# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("[ERROR] Validation Error on", request.url)
    print("[ERROR] Request body:")
    try:
        body = await request.body()
        print(body.decode() if body else "empty body")
    except:
        print("(could not read body)")

    print("[ERROR] Validation errors:")
    for error in exc.errors():
        print(f"  - {error['loc']}: {error['msg']} (type: {error['type']})")

    # Normalize errors to ensure JSON serializability
    normalized_errors = []
    for error in exc.errors():
        normalized_errors.append(
            {
                "loc": list(error.get("loc", [])),
                "msg": str(error.get("msg", "")),
                "type": str(error.get("type", "")),
            }
        )

    return JSONResponse(
        status_code=422,
        content={
            "detail": normalized_errors[0]["msg"]
            if normalized_errors
            else "Validation error",
        },
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health_check():
    return {"status": "running"}
