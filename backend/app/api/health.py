from fastapi import APIRouter
from backend.app.config import settings
from backend.app.core.database import metadata_db
from backend.app.retrieval.graph_retriever import graph_retriever

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    doc_count = len(metadata_db.list_documents())
    chunk_count = len(metadata_db.get_all_chunks())
    graph = graph_retriever.get_full_graph()

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "indexed_documents": doc_count,
        "indexed_chunks": chunk_count,
        "knowledge_graph_nodes": len(graph.nodes),
        "knowledge_graph_edges": len(graph.edges),
        "vector_backend": "Qdrant (In-Memory / Live)" if settings.USE_IN_MEMORY_QDRANT else "Qdrant Server",
        "graph_backend": "In-Memory / Neo4j" if settings.USE_IN_MEMORY_GRAPH else "Neo4j Server"
    }
