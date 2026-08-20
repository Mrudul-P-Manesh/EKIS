import json
import time
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import BenchmarkItem, EvaluationResult, AggregateEvaluationReport, QueryRequest
from backend.app.evaluation.metrics import RAGEvaluatorMetrics
from backend.app.generation.grounded_generator import grounded_generator
from backend.app.core.logging import logger


DEFAULT_BENCHMARK_DATASET: List[Dict[str, Any]] = [
    {
        "id": "bench-1",
        "query": "Why is the authentication service returning 401 errors after deployment?",
        "ground_truth_answer": "Downstream services cached previous public keys for 24 hours without cache invalidation during ADR-004 key rotation.",
        "expected_doc_ids": ["adr_004", "auth_runbook", "incident_401"],
        "expected_entities": ["auth-service", "ADR-004", "401-Unauthorized", "JWT_SECRET_KEY"],
        "category": "Incident Resolution"
    },
    {
        "id": "bench-2",
        "query": "What is the token expiration TTL and key rotation policy specified in ADR-004?",
        "ground_truth_answer": "ADR-004 specifies a 30-day key rotation cycle and access token TTL of 15 minutes.",
        "expected_doc_ids": ["adr_004"],
        "expected_entities": ["ADR-004", "JWT_SECRET_KEY"],
        "category": "Architecture Decision"
    },
    {
        "id": "bench-3",
        "query": "How should engineers mitigate an unauthorized token verification loop in the API gateway?",
        "ground_truth_answer": "Flush the local JWKS cache and trigger the /admin/cache/refresh webhook on the API gateway.",
        "expected_doc_ids": ["auth_runbook"],
        "expected_entities": ["gateway", "auth-service"],
        "category": "Operational Runbook"
    }
]


class BenchmarkRunner:
    """Executes benchmark evaluations and computes aggregate metrics."""

    def __init__(self, dataset: Optional[List[Dict[str, Any]]] = None):
        self.dataset = [BenchmarkItem(**item) for item in (dataset or DEFAULT_BENCHMARK_DATASET)]

    async def run_evaluation_async(self) -> AggregateEvaluationReport:
        results: List[EvaluationResult] = []

        for item in self.dataset:
            start_t = time.time()
            req = QueryRequest(query=item.query, top_k=5)
            ans = await grounded_generator.answer_query_async(req)
            latency = (time.time() - start_t) * 1000.0

            retrieved_doc_ids = [c.doc_id for c in ans.retrieved_sources]
            
            p_at_k = RAGEvaluatorMetrics.precision_at_k(retrieved_doc_ids, item.expected_doc_ids, k=5)
            r_at_k = RAGEvaluatorMetrics.recall_at_k(retrieved_doc_ids, item.expected_doc_ids, k=5)
            mrr = RAGEvaluatorMetrics.mean_reciprocal_rank(retrieved_doc_ids, item.expected_doc_ids)
            groundedness = RAGEvaluatorMetrics.groundedness_score(ans.detailed_explanation, ans.retrieved_sources)
            cit_prec = RAGEvaluatorMetrics.citation_precision(ans.citations, ans.retrieved_sources)
            hallucination = not ans.confidence.is_sufficient_evidence or (cit_prec < 0.5 and len(ans.citations) > 0)

            results.append(EvaluationResult(
                benchmark_id=item.id,
                query=item.query,
                precision_at_k=p_at_k,
                recall_at_k=r_at_k,
                mrr=mrr,
                groundedness_score=groundedness,
                citation_precision=cit_prec,
                hallucination_detected=hallucination,
                latency_ms=round(latency, 2),
                predicted_answer=ans.direct_answer,
                ground_truth_answer=item.ground_truth_answer
            ))

        total = max(len(results), 1)
        return AggregateEvaluationReport(
            total_queries=len(results),
            mean_precision_at_k=round(sum(r.precision_at_k for r in results) / total, 3),
            mean_recall_at_k=round(sum(r.recall_at_k for r in results) / total, 3),
            mean_mrr=round(sum(r.mrr for r in results) / total, 3),
            mean_groundedness=round(sum(r.groundedness_score for r in results) / total, 3),
            mean_citation_precision=round(sum(r.citation_precision for r in results) / total, 3),
            hallucination_rate=round(sum(1 for r in results if r.hallucination_detected) / total, 3),
            average_latency_ms=round(sum(r.latency_ms for r in results) / total, 2),
            results=results
        )


benchmark_runner = BenchmarkRunner()
