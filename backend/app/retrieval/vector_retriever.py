import numpy as np
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest_models
from backend.app.config import settings
from backend.app.models.schemas import DocumentChunk, VectorSearchResult
from backend.app.retrieval.embeddings import embedding_service
from backend.app.core.logging import logger


class VectorRetriever:
    """Vector retrieval using Qdrant with seamless in-memory fallback."""

    def __init__(self):
        self.collection_name = settings.QDRANT_COLLECTION
        self.dim = settings.QDRANT_EMBEDDING_DIM
        self.client: Optional[QdrantClient] = None
        self._in_memory_index: Dict[str, Dict[str, Any]] = {}
        self._init_qdrant()

    def _init_qdrant(self):
        try:
            if settings.USE_IN_MEMORY_QDRANT:
                self.client = QdrantClient(":memory:")
                logger.info("Initialized Qdrant in-memory client.")
            else:
                self.client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                    api_key=settings.QDRANT_API_KEY,
                    timeout=5.0
                )
                logger.info(f"Connected to Qdrant at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")

            # Ensure collection exists
            collections = self.client.get_collections().collections
            col_names = [c.name for c in collections]
            if self.collection_name not in col_names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=rest_models.VectorParams(
                        size=self.dim,
                        distance=rest_models.Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.warning(f"Failed to connect to Qdrant: {e}. Using pure python in-memory vector index fallback.")
            self.client = None

    def index_chunks(self, chunks: List[DocumentChunk]):
        """Index chunks into vector storage."""
        if not chunks:
            return

        for chunk in chunks:
            if not chunk.embedding:
                chunk.embedding = embedding_service.get_embedding(chunk.content)

            payload = {
                "chunk_id": chunk.chunk_id,
                "doc_id": chunk.doc_id,
                "content": chunk.content,
                "chunk_index": chunk.chunk_index,
                "section_heading": chunk.section_heading,
                "source_type": chunk.metadata.source_type,
                "file_name": chunk.metadata.file_name,
                "service_name": chunk.metadata.service_name,
                "tags": chunk.metadata.tags
            }

            # Also maintain local store
            self._in_memory_index[chunk.chunk_id] = {
                "embedding": np.array(chunk.embedding, dtype=np.float32),
                "payload": payload
            }

        # If Qdrant client is connected, push points
        if self.client:
            try:
                points = []
                for chunk in chunks:
                    points.append(rest_models.PointStruct(
                        id=abs(hash(chunk.chunk_id)) % (10**12),
                        vector=chunk.embedding,
                        payload=self._in_memory_index[chunk.chunk_id]["payload"]
                    ))
                self.client.upsert(collection_name=self.collection_name, points=points)
            except Exception as e:
                logger.warning(f"Error upserting to Qdrant: {e}")

    def search(
        self,
        query: str,
        top_k: int = 5,
        filter_service: Optional[str] = None,
        filter_source_type: Optional[str] = None
    ) -> List[VectorSearchResult]:
        query_vec = embedding_service.get_embedding(query)
        results: List[VectorSearchResult] = []

        if self.client:
            try:
                query_filter = None
                conditions = []
                if filter_service:
                    conditions.append(rest_models.FieldCondition(
                        key="service_name",
                        match=rest_models.MatchValue(value=filter_service)
                    ))
                if filter_source_type:
                    conditions.append(rest_models.FieldCondition(
                        key="source_type",
                        match=rest_models.MatchValue(value=filter_source_type)
                    ))
                if conditions:
                    query_filter = rest_models.Filter(must=conditions)

                search_res = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vec,
                    query_filter=query_filter,
                    limit=top_k
                )

                for rank, hit in enumerate(search_res, 1):
                    p = hit.payload or {}
                    results.append(VectorSearchResult(
                        chunk_id=p.get("chunk_id", str(hit.id)),
                        doc_id=p.get("doc_id", ""),
                        content=p.get("content", ""),
                        similarity_score=float(hit.score),
                        rank=rank,
                        metadata=p
                    ))
                return results
            except Exception as e:
                logger.warning(f"Qdrant search error: {e}. Falling back to in-memory cosine search.")

        # In-memory cosine search fallback
        q_arr = np.array(query_vec, dtype=np.float32)
        q_norm = np.linalg.norm(q_arr)
        if q_norm == 0:
            return []

        scored_items = []
        for cid, data in self._in_memory_index.items():
            payload = data["payload"]
            if filter_service and payload.get("service_name") != filter_service:
                continue
            if filter_source_type and payload.get("source_type") != filter_source_type:
                continue

            doc_arr = data["embedding"]
            doc_norm = np.linalg.norm(doc_arr)
            sim = 0.0
            if doc_norm > 0:
                sim = float(np.dot(q_arr, doc_arr) / (q_norm * doc_norm))
            scored_items.append((sim, cid, payload))

        scored_items.sort(key=lambda x: x[0], reverse=True)
        top_items = scored_items[:top_k]

        for rank, (score, cid, payload) in enumerate(top_items, 1):
            results.append(VectorSearchResult(
                chunk_id=cid,
                doc_id=payload.get("doc_id", ""),
                content=payload.get("content", ""),
                similarity_score=max(0.0, min(1.0, score)),
                rank=rank,
                metadata=payload
            ))

        return results

    def clear(self):
        self._in_memory_index.clear()
        if self.client:
            try:
                self.client.delete_collection(self.collection_name)
                self._init_qdrant()
            except Exception as e:
                logger.warning(f"Error clearing Qdrant: {e}")


vector_retriever = VectorRetriever()
