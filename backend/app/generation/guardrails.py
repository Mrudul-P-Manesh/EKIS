import re
from typing import List, Dict, Any, Tuple
from backend.app.config import settings
from backend.app.models.schemas import Citation, ConfidenceIndicator, ConfidenceLevel, RetrievedChunk
from backend.app.core.logging import logger


class GroundingGuardrails:
    """Validates citations, detects hallucinations, checks sufficiency, and scores confidence."""

    def __init__(self, min_confidence: float = 0.35):
        self.min_confidence = min_confidence or settings.MIN_CONFIDENCE_THRESHOLD

    def validate_and_refine(
        self,
        llm_response: Dict[str, Any],
        available_citations: List[Citation],
        retrieved_chunks: List[RetrievedChunk]
    ) -> Tuple[Dict[str, Any], List[Citation], ConfidenceIndicator]:
        direct_ans = llm_response.get("direct_answer", "")
        detailed_exp = llm_response.get("detailed_explanation", "")
        combined_text = f"{direct_ans} {detailed_exp}"

        # 1. Extract all cited tags e.g. [SOURCE-1], [SOURCE-2]
        cited_tags = re.findall(r"\[SOURCE-(\d+)\]", combined_text)
        cited_indices = set(int(t) for t in cited_tags)

        # 2. Filter citations to only those actually cited in the answer
        active_citations: List[Citation] = []
        for cit in available_citations:
            if cit.citation_id in cited_indices:
                active_citations.append(cit)

        # 3. Check for invalid / out-of-range citations (Hallucinated citation IDs)
        max_valid_id = len(available_citations)
        invalid_citations = [cid for cid in cited_indices if cid > max_valid_id or cid < 1]

        # 4. Check evidence sufficiency
        is_sufficient = llm_response.get("is_sufficient_evidence", True)
        if not retrieved_chunks or len(available_citations) == 0 or len(active_citations) == 0:
            is_sufficient = False

        contradictions = llm_response.get("contradictions_found", [])

        # 5. Compute calibrated confidence score
        base_score = float(llm_response.get("confidence_score", 0.85))
        
        # Penalize if citations are missing when chunks were available
        if not active_citations and available_citations:
            base_score *= 0.50
            is_sufficient = False
        
        # Penalize invalid citations
        if invalid_citations:
            base_score *= 0.70

        # Penalize contradictions
        if contradictions:
            base_score *= 0.80

        # Weight with top chunk retrieval score
        if retrieved_chunks:
            top_chunk_score = retrieved_chunks[0].score
            base_score = (base_score * 0.5) + (top_chunk_score * 0.5)
        else:
            base_score = 0.0

        final_score = round(max(0.0, min(0.99, base_score)), 3)

        # Determine confidence level
        if not is_sufficient or final_score < self.min_confidence:
            level = ConfidenceLevel.UNRELIABLE
            is_sufficient = False
        elif final_score >= 0.80:
            level = ConfidenceLevel.HIGH
        elif final_score >= 0.55:
            level = ConfidenceLevel.MEDIUM
        else:
            level = ConfidenceLevel.LOW

        # If insufficient evidence, enforce standard refusal message
        if not is_sufficient:
            direct_ans = settings.OUT_OF_DOMAIN_REFUSAL_MESSAGE
            detailed_exp = "The indexed engineering documentation, architecture decision records (ADRs), runbooks, and source code do not contain sufficient evidence to answer this question reliably."
            llm_response["direct_answer"] = direct_ans
            llm_response["detailed_explanation"] = detailed_exp
            llm_response["evidence_summary"] = "No matching engineering sources found."
            active_citations = []

        confidence = ConfidenceIndicator(
            score=final_score if is_sufficient else 0.0,
            level=level,
            reasoning=f"Grounded in {len(active_citations)} valid source citations with confidence level {level}." if is_sufficient else "Insufficient retrieval evidence. Query rejected.",
            is_sufficient_evidence=is_sufficient,
            contradictions_found=contradictions
        )

        return llm_response, active_citations, confidence


guardrails = GroundingGuardrails()
