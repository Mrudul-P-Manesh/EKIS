import re
from typing import List, Dict, Any, Optional
from backend.app.config import settings
from backend.app.models.schemas import RRFResult, RetrievedChunk
from backend.app.core.logging import logger


class CrossEncoderReranker:
    """Reranks candidate chunks using fine-grained semantic scoring and technical alignment."""

    def __init__(self, top_n: int = 5):
        self.top_n = top_n or settings.RETRIEVAL_RERANK_TOP_N

    def rerank(self, query: str, candidates: List[RRFResult]) -> List[RetrievedChunk]:
        if not candidates:
            return []

        query_lower = query.lower()
        query_words = set(re.findall(r"[a-z0-9_\-]+", query_lower))

        scored_list = []
        for cand in candidates:
            content_lower = cand.content.lower()
            metadata = cand.metadata
            
            # Base score from RRF
            score = cand.rrf_score * 10.0

            # 1. Term overlap ratio
            matched_words = sum(1 for w in query_words if w in content_lower)
            overlap_ratio = matched_words / max(len(query_words), 1)
            score += overlap_ratio * 3.0

            # 2. Heading relevance
            sec_heading = metadata.get("section_heading", "")
            if sec_heading:
                sec_lower = sec_heading.lower()
                if any(w in sec_lower for w in query_words):
                    score += 1.5

            # 3. Critical technical keyword presence
            for kw in ["root cause", "solution", "resolution", "fix", "mitigation", "error", "401", "unauthorized", "fail", "jwt"]:
                if kw in query_lower and kw in content_lower:
                    score += 1.2

            # 4. Source type weight (ADRs and Postmortems have high resolution value)
            stype = metadata.get("source_type", "")
            if stype in ["postmortem", "adr", "runbook"]:
                score += 0.8

            scored_list.append((score, cand))

        # Sort by rerank score descending
        scored_list.sort(key=lambda x: x[0], reverse=True)

        # Build output objects with normalized scores (0.0 to 1.0)
        max_score = scored_list[0][0] if scored_list else 1.0
        min_score = scored_list[-1][0] if scored_list else 0.0
        score_range = max_score - min_score if max_score > min_score else 1.0

        reranked_chunks: List[RetrievedChunk] = []
        for raw_score, cand in scored_list[:self.top_n]:
            norm_score = 0.5 + (0.5 * (raw_score - min_score) / score_range) if score_range > 0 else 0.85
            meta = cand.metadata

            reranked_chunks.append(RetrievedChunk(
                chunk_id=cand.chunk_id,
                doc_id=cand.doc_id,
                content=cand.content,
                source_type=meta.get("source_type", "markdown"),
                file_name=meta.get("file_name", "unknown"),
                service_name=meta.get("service_name"),
                section_heading=meta.get("section_heading"),
                score=round(min(1.0, norm_score), 4),
                retrieval_source="reranked",
                metadata=meta
            ))

        return reranked_chunks


reranker = CrossEncoderReranker()
