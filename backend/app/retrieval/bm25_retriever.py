import re
from typing import List, Dict, Any, Optional
from rank_bm25 import BM25Okapi
from backend.app.models.schemas import DocumentChunk, BM25SearchResult
from backend.app.core.logging import logger


class BM25Retriever:
    """BM25Okapi keyword retriever with technical token preservation and exact-match boosts."""

    def __init__(self):
        self.chunks: List[DocumentChunk] = []
        self.corpus_tokens: List[List[str]] = []
        self.bm25: Optional[BM25Okapi] = None
        self.chunk_id_map: Dict[str, DocumentChunk] = {}

    def _tokenize(self, text: str) -> List[str]:
        # Preserve technical tokens like foo_bar, ADR-004, /api/v1/auth, 401
        text_lower = text.lower()
        # Find alphanumeric words, dashed terms, underscores, and forward slashes
        tokens = re.findall(r"[a-z0-9_\-/\.]+", text_lower)
        return [t for t in tokens if len(t) > 1 or t.isdigit()]

    def index_chunks(self, chunks: List[DocumentChunk]):
        """Index or update chunk corpus."""
        for c in chunks:
            if c.chunk_id not in self.chunk_id_map:
                self.chunks.append(c)
                self.chunk_id_map[c.chunk_id] = c
                self.corpus_tokens.append(self._tokenize(c.content))

        if self.corpus_tokens:
            self.bm25 = BM25Okapi(self.corpus_tokens)
            logger.info(f"BM25 index built with {len(self.chunks)} chunks.")

    def search(
        self,
        query: str,
        top_k: int = 5,
        filter_service: Optional[str] = None,
        filter_source_type: Optional[str] = None
    ) -> List[BM25SearchResult]:
        if not self.bm25 or not self.chunks:
            return []

        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scores = self.bm25.get_scores(query_tokens)

        # Apply exact symbol / keyword boost
        scored_candidates = []
        for idx, score in enumerate(scores):
            chunk = self.chunks[idx]
            metadata = chunk.metadata.model_dump() if hasattr(chunk.metadata, "model_dump") else chunk.metadata

            if filter_service and metadata.get("service_name") != filter_service:
                continue
            if filter_source_type and metadata.get("source_type") != filter_source_type:
                continue

            content_lower = chunk.content.lower()
            boost = 1.0
            
            # Exact query phrase boost
            if query.lower() in content_lower:
                boost += 0.5

            # Critical error code / token boosts
            for token in query_tokens:
                if token in ["401", "403", "500", "jwt", "token", "unauthorized", "expired", "rotation"]:
                    if token in content_lower:
                        boost += 0.2

            final_score = float(score * boost)
            if final_score > 0:
                scored_candidates.append((final_score, chunk))

        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_items = scored_candidates[:top_k]

        results = []
        for rank, (score, chunk) in enumerate(top_items, 1):
            metadata_dict = chunk.metadata.model_dump() if hasattr(chunk.metadata, "model_dump") else chunk.metadata
            results.append(BM25SearchResult(
                chunk_id=chunk.chunk_id,
                doc_id=chunk.doc_id,
                content=chunk.content,
                bm25_score=score,
                rank=rank,
                metadata=metadata_dict
            ))

        return results

    def clear(self):
        self.chunks.clear()
        self.corpus_tokens.clear()
        self.chunk_id_map.clear()
        self.bm25 = None


bm25_retriever = BM25Retriever()
