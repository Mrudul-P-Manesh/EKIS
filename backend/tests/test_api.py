import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_api_query():
    response = client.post("/api/v1/query/", json={
        "query": "Why is the authentication service returning 401 errors after deployment?",
        "top_k": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert "direct_answer" in data
    assert "confidence" in data
    assert len(data["retrieved_sources"]) > 0


def test_api_debugger_trace():
    response = client.post("/api/v1/debugger/trace", json={
        "query": "JWT key rotation ADR-004",
        "top_k": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert "vector_results" in data
    assert "bm25_results" in data
    assert "fused_results" in data


def test_api_graph():
    response = client.get("/api/v1/graph/")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
