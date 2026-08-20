from fastapi import APIRouter
from backend.app.models.schemas import QueryRequest, RetrievalDebuggerTrace
from backend.app.retrieval.hybrid_retriever import hybrid_retriever
from backend.app.retrieval.reranker import reranker

router = APIRouter(prefix="/debugger", tags=["Retrieval Debugger"])


@router.post("/trace", response_model=RetrievalDebuggerTrace)
def debug_retrieval_pipeline(req: QueryRequest):
    fused_results, trace = hybrid_retriever.retrieve(
        query=req.query,
        top_k=req.top_k,
        use_vector=req.use_vector,
        use_bm25=req.use_bm25,
        use_graph=req.use_graph,
        filter_service=req.filter_service,
        filter_source_type=req.filter_source_type
    )

    if req.use_reranker and fused_results:
        reranked_chunks = reranker.rerank(req.query, fused_results)
        trace.reranked_results = reranked_chunks

    return trace
