from fastapi import APIRouter
from backend.app.models.schemas import GraphSubgraph
from backend.app.retrieval.graph_retriever import graph_retriever

router = APIRouter(prefix="/graph", tags=["Knowledge Graph"])


@router.get("/", response_model=GraphSubgraph)
def get_graph():
    return graph_retriever.get_full_graph()


@router.get("/search")
def search_graph(query: str, top_k: int = 5):
    return graph_retriever.search_entities(query=query, top_k=top_k)
