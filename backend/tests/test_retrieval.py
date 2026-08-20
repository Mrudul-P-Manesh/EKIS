import pytest
from backend.app.models.schemas import DocumentChunk, DocumentMetadata, IngestionRequest
from backend.app.retrieval.vector_retriever import vector_retriever
from backend.app.retrieval.bm25_retriever import bm25_retriever
from backend.app.retrieval.graph_retriever import graph_retriever
from backend.app.retrieval.hybrid_retriever import hybrid_retriever
from backend.app.retrieval.reranker import reranker
from backend.app.ingestion.pipeline import ingestion_pipeline


def test_vector_and_bm25_retrieval():
    req = IngestionRequest(
        title="JWT Rotation Policy",
        content="ADR-004 defines JWT key rotation every 30 days. Downstream cache causes 401 unauthorized errors.",
        source_type="adr",
        file_name="adr_004.md",
        service_name="auth-service"
    )
    resp = ingestion_pipeline.ingest_document(req)
    assert resp.status == "success"

    # Vector search
    v_results = vector_retriever.search("JWT key rotation 401", top_k=3)
    assert len(v_results) > 0
    assert any("ADR-004" in r.content for r in v_results)

    # BM25 search
    bm25_results = bm25_retriever.search("401 unauthorized ADR-004", top_k=3)
    assert len(bm25_results) > 0
    assert any("ADR-004" in r.content for r in bm25_results)


def test_hybrid_and_reranking():
    fused, trace = hybrid_retriever.retrieve(
        query="Why is auth-service returning 401 errors?",
        top_k=5
    )
    assert len(fused) > 0
    assert trace.query_intent is not None
    assert len(trace.vector_results) > 0

    reranked = reranker.rerank("auth-service 401 errors", fused)
    assert len(reranked) > 0
    assert reranked[0].score >= reranked[-1].score
