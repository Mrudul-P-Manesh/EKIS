import os
import glob
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.api.router import api_router
from backend.app.ingestion.pipeline import ingestion_pipeline
from backend.app.core.database import metadata_db
from backend.app.retrieval.graph_retriever import graph_retriever
from backend.app.core.logging import logger


def load_initial_sample_data():
    """Seed sample engineering documents if database or graph is empty."""
    current_graph = graph_retriever.get_full_graph()
    existing_docs = metadata_db.list_documents()
    if existing_docs and len(current_graph.nodes) > 0:
        logger.info(f"Database already contains {len(existing_docs)} documents and {len(current_graph.nodes)} graph nodes. Skipping seed.")
        return

    sample_docs_dir = os.path.join(os.path.dirname(__file__), "..", "sample_data", "docs")
    sample_code_dir = os.path.join(os.path.dirname(__file__), "..", "sample_data", "code")

    files_to_seed = []
    if os.path.exists(sample_docs_dir):
        files_to_seed.extend(glob.glob(os.path.join(sample_docs_dir, "*.*")))
    if os.path.exists(sample_code_dir):
        files_to_seed.extend(glob.glob(os.path.join(sample_code_dir, "*.*")))

    for fpath in files_to_seed:
        try:
            srv = "auth-service" if "auth" in fpath or "jwt" in fpath else None
            ingestion_pipeline.ingest_file(fpath, service_name=srv)
            logger.info(f"Seeded sample document: {fpath}")
        except Exception as e:
            logger.warning(f"Failed to seed {fpath}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} backend...")
    load_initial_sample_data()
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} backend...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Engineering Knowledge Intelligence System (EKIS) Production RAG Backend",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "Welcome to the Engineering Knowledge Intelligence System (EKIS) API",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "operational"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error": str(exc)}
    )
