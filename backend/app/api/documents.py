import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.app.models.schemas import IngestionRequest, IngestionResponse
from backend.app.ingestion.pipeline import ingestion_pipeline
from backend.app.core.database import metadata_db
from backend.app.core.logging import logger

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/ingest", response_model=IngestionResponse)
def ingest_text_document(req: IngestionRequest):
    try:
        return ingestion_pipeline.ingest_document(req)
    except Exception as e:
        logger.error(f"Error ingesting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload", response_model=IngestionResponse)
async def upload_file(
    file: UploadFile = File(...),
    service_name: Optional[str] = Form(None),
    source_type: Optional[str] = Form(None)
):
    try:
        uploads_dir = "./data/uploads"
        os.makedirs(uploads_dir, exist_ok=True)
        file_path = os.path.join(uploads_dir, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resp = ingestion_pipeline.ingest_file(file_path, service_name=service_name)
        return resp
    except Exception as e:
        logger.error(f"Error processing file upload: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process file upload: {str(e)}")


@router.get("/")
def list_documents():
    return metadata_db.list_documents()


@router.get("/{doc_id}")
def get_document(doc_id: str):
    doc = metadata_db.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    chunks = metadata_db.get_chunks_for_doc(doc_id)
    doc["chunks"] = chunks
    return doc


@router.delete("/{doc_id}")
def delete_document(doc_id: str):
    success = metadata_db.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or already deleted")
    return {"status": "deleted", "doc_id": doc_id}
