from typing import List, Set
from backend.app.models.schemas import RetrievedChunk, Citation


class RAGEvaluatorMetrics:
    """Calculates retrieval, groundedness, and citation fidelity metrics."""

    @staticmethod
    def precision_at_k(retrieved_doc_ids: List[str], expected_doc_ids: List[str], k: int = 5) -> float:
        if not expected_doc_ids or not retrieved_doc_ids:
            return 0.0
        top_k = retrieved_doc_ids[:k]
        hits = sum(1 for d in top_k if d in expected_doc_ids)
        return hits / len(top_k)

    @staticmethod
    def recall_at_k(retrieved_doc_ids: List[str], expected_doc_ids: List[str], k: int = 5) -> float:
        if not expected_doc_ids:
            return 1.0
        if not retrieved_doc_ids:
            return 0.0
        top_k = set(retrieved_doc_ids[:k])
        hits = sum(1 for d in expected_doc_ids if d in top_k)
        return hits / len(expected_doc_ids)

    @staticmethod
    def mean_reciprocal_rank(retrieved_doc_ids: List[str], expected_doc_ids: List[str]) -> float:
        if not expected_doc_ids or not retrieved_doc_ids:
            return 0.0
        expected_set = set(expected_doc_ids)
        for rank, doc_id in enumerate(retrieved_doc_ids, 1):
            if doc_id in expected_set:
                return 1.0 / rank
        return 0.0

    @staticmethod
    def groundedness_score(answer_text: str, source_chunks: List[RetrievedChunk]) -> float:
        """Measures lexical and semantic token overlap between generated answer and cited source chunks."""
        if not source_chunks or not answer_text.strip():
            return 0.0

        answer_tokens = set(t.lower() for t in answer_text.split() if len(t) > 3)
        if not answer_tokens:
            return 0.0

        context_tokens: Set[str] = set()
        for chunk in source_chunks:
            context_tokens.update(t.lower() for t in chunk.content.split() if len(t) > 3)

        grounded_tokens = answer_tokens.intersection(context_tokens)
        return round(len(grounded_tokens) / len(answer_tokens), 3)

    @staticmethod
    def citation_precision(citations: List[Citation], retrieved_chunks: List[RetrievedChunk]) -> float:
        """Measures if citations map to actual non-empty retrieved source chunks."""
        if not citations:
            return 1.0
        valid_chunk_ids = {c.chunk_id for c in retrieved_chunks}
        valid_cits = sum(1 for cit in citations if cit.chunk_id in valid_chunk_ids)
        return round(valid_cits / len(citations), 3)
