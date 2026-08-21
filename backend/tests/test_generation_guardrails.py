import pytest
from backend.app.config import settings
from backend.app.models.schemas import QueryRequest, Citation, RetrievedChunk
from backend.app.generation.grounded_generator import grounded_generator
from backend.app.generation.guardrails import guardrails


def test_grounded_generator_relevant_query():
    """Relevant engineering question should return grounded answer with citations."""
    req = QueryRequest(query="Why is the authentication service returning 401 errors after deployment?")
    ans = grounded_generator.answer_query(req)
    
    assert ans.direct_answer != ""
    assert "I could not find" not in ans.direct_answer
    assert ans.confidence.score >= 0.50
    assert len(ans.citations) > 0
    assert ans.confidence.is_sufficient_evidence is True
    assert len(ans.retrieved_sources) > 0


def test_grounded_generator_adr_query():
    """Specific ADR engineering question should return grounded answer with ADR citations."""
    req = QueryRequest(query="Explain ADR-004 and key rotation policy.")
    ans = grounded_generator.answer_query(req)

    assert ans.direct_answer != ""
    assert "I could not find" not in ans.direct_answer
    assert len(ans.citations) > 0
    assert ans.confidence.is_sufficient_evidence is True


def test_grounded_generator_out_of_domain_refusal():
    """Unrelated / out-of-domain queries should be cleanly refused without calling LLM."""
    unrelated_queries = [
        "Who is the CEO of Tesla?",
        "What is today's weather?",
        "Tell me a joke."
    ]

    for q in unrelated_queries:
        req = QueryRequest(query=q)
        ans = grounded_generator.answer_query(req)

        assert ans.direct_answer == settings.OUT_OF_DOMAIN_REFUSAL_MESSAGE
        assert ans.confidence.is_sufficient_evidence is False
        assert len(ans.citations) == 0
        assert len(ans.retrieved_sources) == 0


def test_grounded_generator_low_confidence_refusal():
    """Query with low confidence retrieval should refuse."""
    req = QueryRequest(query="What is the capital city of France?")
    ans = grounded_generator.answer_query(req)

    assert ans.direct_answer == settings.OUT_OF_DOMAIN_REFUSAL_MESSAGE
    assert ans.confidence.is_sufficient_evidence is False
    assert len(ans.citations) == 0


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
    assert refined["direct_answer"] == settings.OUT_OF_DOMAIN_REFUSAL_MESSAGE
