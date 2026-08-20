from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import QueryRequest, AnswerResponse
from backend.app.generation.grounded_generator import grounded_generator
from backend.app.core.logging import logger

router = APIRouter(prefix="/query", tags=["Query & RAG"])


@router.post("/", response_model=AnswerResponse)
async def query_knowledge_base(req: QueryRequest):
    try:
        response = await grounded_generator.answer_query_async(req)
        return response
    except Exception as e:
        logger.error(f"Error answering query: {e}")
        raise HTTPException(status_code=500, detail=str(e))
