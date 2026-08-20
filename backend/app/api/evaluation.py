from fastapi import APIRouter
from backend.app.models.schemas import AggregateEvaluationReport
from backend.app.evaluation.benchmark import benchmark_runner

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])


@router.post("/run", response_model=AggregateEvaluationReport)
async def run_evaluation():
    report = await benchmark_runner.run_evaluation_async()
    return report
