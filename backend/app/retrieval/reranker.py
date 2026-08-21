import re
from typing import List, Dict, Any, Optional, Set
from backend.app.config import settings
from backend.app.models.schemas import RRFResult, RetrievedChunk
from backend.app.core.logging import logger

STOPWORDS: Set[str] = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "in", "on", "at", "to", "for", "from", "by", "about", "with", "into",
    "through", "during", "before", "after", "above", "below", "up", "down",
    "of", "and", "or", "not", "no", "what", "who", "whom", "whose", "which",
    "where", "when", "why", "how", "all", "any", "both", "each", "few", "more",
    "most", "other", "some", "such", "than", "too", "very", "can", "will",
    "just", "should", "now", "me", "tell", "show", "give", "please"
}


class CrossEncoderReranker:
    """Reranks candidate chunks using fine-grained semantic scoring, token overlap, and technical alignment."""

    def __init__(self, top_n: int = 5):
        self.top_n = top_n or settings.RETRIEVAL_RERANK_TOP_N

    def _extract_query_keywords(self, query: str) -> Set[str]:
        tokens = re.findall(r"[a-z0-9_\-]+", query.lower())
        # Filter stopwords unless it's a technical code/number
        keywords = {t for t in tokens if t not in STOPWORDS or t.isdigit() or "_" in t or "-" in t}
        return keywords if keywords else set(tokens)

    def rerank(self, query: str, candidates: List[RRFResult]) -> List[RetrievedChunk]:
        if not candidates:
            return []

        query_lower = query.lower()
        query_keywords = self._extract_query_keywords(query)
        total_keywords = max(len(query_keywords), 1)

        scored_list = []
        for cand in candidates:
            content_lower = cand.content.lower()
            metadata = cand.metadata or {}
            
            # 1. Significant keyword matches
            matched_keywords = sum(1 for w in query_keywords if w in content_lower)
            term_overlap = matched_keywords / total_keywords

            # 2. Heading relevance
            heading_boost = 0.0
            sec_heading = (metadata.get("section_heading") or "").lower()
            if sec_heading and any(w in sec_heading for w in query_keywords):
                matched_heading_words = sum(1 for w in query_keywords if w in sec_heading)
                heading_boost = (matched_heading_words / total_keywords) * 1.5

            # 3. Exact phrase match
            phrase_boost = 1.0 if (len(query_lower) > 5 and query_lower in content_lower) else 0.0

            # 4. Critical technical tokens (error codes, service names, ADRs)
            tech_token_boost = 0.0
            for kw in query_keywords:
                if re.match(r"^(?:4\d\d|5\d\d|adr[-_]?\d+|inc[-_]?\d+|jwt|token|runbook|auth|middleware|gateway)", kw):
                    if kw in content_lower or kw in sec_heading:
                        tech_token_boost += 0.5

            # If absolutely zero keywords match and no graph/tech tokens match
            if matched_keywords == 0 and heading_boost == 0 and phrase_boost == 0 and tech_token_boost == 0:
                final_score = 0.0
            else:
                # Weighted composite score
                raw_score = (
                    (term_overlap * 3.5) +
                    (heading_boost * 1.5) +
                    (phrase_boost * 2.0) +
                    (tech_token_boost * 1.5) +
                    (cand.rrf_score * 5.0)
                )
                final_score = min(1.0, max(0.0, raw_score / 4.0))

            scored_list.append((final_score, cand))

        # Sort by rerank score descending
        scored_list.sort(key=lambda x: x[0], reverse=True)

        reranked_chunks: List[RetrievedChunk] = []
        for score, cand in scored_list[:self.top_n]:
            meta = cand.metadata or {}
            reranked_chunks.append(RetrievedChunk(
                chunk_id=cand.chunk_id,
                doc_id=cand.doc_id,
                content=cand.content,
                source_type=meta.get("source_type", "markdown"),
                file_name=meta.get("file_name", "unknown"),
                service_name=meta.get("service_name"),
                section_heading=meta.get("section_heading"),
                score=round(score, 4),
                retrieval_source="reranked",
                metadata=meta
            ))

        return reranked_chunks


reranker = CrossEncoderReranker()
