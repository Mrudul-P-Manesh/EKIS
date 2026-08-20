from fastapi import APIRouter
from backend.app.api.health import router as health_router
from backend.app.api.documents import router as documents_router
from backend.app.api.query import router as query_router
from backend.app.api.debugger import router as debugger_router
from backend.app.api.graph import router as graph_router
from backend.app.api.evaluation import router as eval_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(documents_router)
api_router.include_router(query_router)
api_router.include_router(debugger_router)
api_router.include_router(graph_router)
api_router.include_router(eval_router)
