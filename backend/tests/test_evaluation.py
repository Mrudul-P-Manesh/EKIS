import pytest
from backend.app.evaluation.metrics import RAGEvaluatorMetrics
from backend.app.evaluation.benchmark import BenchmarkRunner
from backend.app.models.schemas import RetrievedChunk, Citation


def test_metrics_precision_recall_mrr():
    retrieved = ["doc_a", "doc_b", "doc_c", "doc_d"]
    expected = ["doc_b", "doc_e"]

    p = RAGEvaluatorMetrics.precision_at_k(retrieved, expected, k=2)
    assert p == 0.5  # doc_b is in top 2 (1/2)

    r = RAGEvaluatorMetrics.recall_at_k(retrieved, expected, k=4)
    assert r == 0.5  # doc_b is found out of [doc_b, doc_e] (1/2)

    mrr = RAGEvaluatorMetrics.mean_reciprocal_rank(retrieved, expected)
    assert mrr == 0.5  # first hit is at index 2 (1/2)


@pytest.mark.asyncio
async def test_benchmark_runner():
    runner = BenchmarkRunner()
    report = await runner.run_evaluation_async()
    assert report.total_queries == 3
    assert report.mean_precision_at_k >= 0.0
    assert report.average_latency_ms >= 0.0
