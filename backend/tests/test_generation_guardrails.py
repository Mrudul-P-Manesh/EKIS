import pytest
from backend.app.models.schemas import QueryRequest, Citation, RetrievedChunk
from backend.app.generation.grounded_generator import grounded_generator
from backend.app.generation.guardrails import guardrails


def test_grounded_generator_answer():
    req = QueryRequest(query="Why is the authentication service returning 401 errors after deployment?")
    ans = grounded_generator.answer_query(req)
    
    assert ans.direct_answer != ""
    assert ans.confidence.score > 0.0
    assert len(ans.citations) > 0
    assert ans.confidence.is_sufficient_evidence is True
    assert ans.debug_trace is not None


def test_guardrails_insufficient_evidence():
    fake_llm = {
        "direct_answer": "Something completely made up without source context.",
        "detailed_explanation": "More unsupported claims.",
        "is_sufficient_evidence": False,
        "confidence_score": 0.2
    }
    refined, active_cits, confidence = guardrails.validate_and_refine(
        llm_response=fake_llm,
        available_citations=[],
        retrieved_chunks=[]
    )
    assert confidence.is_sufficient_evidence is False
    assert "do not contain sufficient evidence" in refined["direct_answer"]
