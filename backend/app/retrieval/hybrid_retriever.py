import time
from typing import List, Dict, Any, Optional
from collections import defaultdict
from backend.app.config import settings
from backend.app.models.schemas import (
    RetrievedChunk, VectorSearchResult, BM25SearchResult, GraphSearchResult,
    RRFResult, RetrievalDebuggerTrace
)
from backend.app.retrieval.vector_retriever import vector_retriever
from backend.app.retrieval.bm25_retriever import bm25_retriever
from backend.app.retrieval.graph_retriever import graph_retriever
from backend.app.core.database import metadata_db
from backend.app.core.logging import logger


class HybridRetriever:
    """Hybrid retrieval fusing Vector, BM25 keyword, and Knowledge Graph retrieval via Reciprocal Rank Fusion."""

    def __init__(self, rrf_k: int = 60):
        self.rrf_k = rrf_k or settings.RETRIEVAL_RRF_K

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        use_vector: bool = True,
        use_bm25: bool = True,
        use_graph: bool = True,
        filter_service: Optional[str] = None,
        filter_source_type: Optional[str] = None
    ) -> tuple[List[RRFResult], RetrievalDebuggerTrace]:
        start_time = time.time()
        vector_res: List[VectorSearchResult] = []
        bm25_res: List[BM25SearchResult] = []
        graph_res: List[GraphSearchResult] = []

        # 1. Vector Search
        if use_vector:
            vector_res = vector_retriever.search(
                query=query,
                top_k=settings.RETRIEVAL_TOP_K_VECTOR,
                filter_service=filter_service,
                filter_source_type=filter_source_type
            )

        # 2. BM25 Keyword Search
        if use_bm25:
            bm25_res = bm25_retriever.search(
                query=query,
                top_k=settings.RETRIEVAL_TOP_K_BM25,
                filter_service=filter_service,
                filter_source_type=filter_source_type
            )

        # 3. Knowledge Graph Search
        if use_graph:
            graph_res = graph_retriever.search_entities(
                query=query,
                top_k=settings.RETRIEVAL_TOP_K_GRAPH
            )

        # 4. Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[str, float] = defaultdict(float)
        chunk_content_map: Dict[str, Dict[str, Any]] = {}
        vector_ranks: Dict[str, int] = {}
        bm25_ranks: Dict[str, int] = {}
        graph_ranks: Dict[str, int] = {}

        # Ingest Vector ranks
        for item in vector_res:
            cid = item.chunk_id
            vector_ranks[cid] = item.rank
            rrf_scores[cid] += 1.0 / (self.rrf_k + item.rank)
            chunk_content_map[cid] = {
                "doc_id": item.doc_id,
                "content": item.content,
                "metadata": item.metadata
            }

        # Ingest BM25 ranks
        for item in bm25_res:
            cid = item.chunk_id
            bm25_ranks[cid] = item.rank
            rrf_scores[cid] += 1.0 / (self.rrf_k + item.rank)
            if cid not in chunk_content_map:
                chunk_content_map[cid] = {
                    "doc_id": item.doc_id,
                    "content": item.content,
                    "metadata": item.metadata
                }

        # Ingest Graph ranks (if chunk_id is associated or synthesize context)
        for item in graph_res:
            if item.chunk_id and item.chunk_id in chunk_content_map:
                cid = item.chunk_id
                graph_ranks[cid] = item.rank
                rrf_scores[cid] += 1.2 / (self.rrf_k + item.rank) # Graph relevance boost
            elif item.doc_id:
                # Find matching chunk for doc_id
                doc_chunks = metadata_db.get_chunks_for_doc(item.doc_id)
                if doc_chunks:
                    cid = doc_chunks[0]["chunk_id"]
                    graph_ranks[cid] = item.rank
                    rrf_scores[cid] += 1.0 / (self.rrf_k + item.rank)
                    if cid not in chunk_content_map:
                        chunk_content_map[cid] = {
                            "doc_id": item.doc_id,
                            "content": doc_chunks[0]["content"],
                            "metadata": doc_chunks[0]["metadata"]
                        }

        # Sort combined results by RRF score descending
        fused_items: List[RRFResult] = []
        sorted_chunks = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)

        for cid, score in sorted_chunks[:max(top_k * 2, 10)]:
            c_info = chunk_content_map.get(cid, {})
            fused_items.append(RRFResult(
                chunk_id=cid,
                doc_id=c_info.get("doc_id", ""),
                content=c_info.get("content", ""),
                vector_rank=vector_ranks.get(cid),
                bm25_rank=bm25_ranks.get(cid),
                graph_rank=graph_ranks.get(cid),
                rrf_score=score,
                metadata=c_info.get("metadata", {})
            ))

        total_time_ms = (time.time() - start_time) * 1000.0

        trace = RetrievalDebuggerTrace(
            query=query,
            query_intent="technical_troubleshooting" if "401" in query or "error" in query else "architectural_query",
            extracted_entities=[g.entity_label for g in graph_res],
            vector_results=vector_res,
            bm25_results=bm25_res,
            graph_results=graph_res,
            fused_results=fused_items,
            reranked_results=[],
            total_retrieval_time_ms=round(total_time_ms, 2)
        )

        return fused_items, trace


hybrid_retriever = HybridRetriever()
