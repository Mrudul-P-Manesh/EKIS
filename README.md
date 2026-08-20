# Engineering Knowledge Intelligence System (EKIS)

[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14%2B-black.svg)](https://nextjs.org)
[![Qdrant](https://img.shields.io/badge/Vector_DB-Qdrant-red.svg)](https://qdrant.tech)
[![Neo4j](https://img.shields.io/badge/Graph_DB-Neo4j-008CC1.svg)](https://neo4j.com)

**EKIS** is a production-grade Retrieval-Augmented Generation (RAG) platform purpose-built for engineering organizations. It ingests microservice documentation, Architecture Decision Records (ADRs), source code repositories, postmortems, and operational runbooks to answer complex technical questions with **hybrid retrieval, knowledge graph traversal, cross-encoder reranking, interactive citations, and strict hallucination prevention**.

---

## 🌟 Key Architectural Features

1. **Structure-Aware Ingestion Pipeline**:
   - Parses Markdown headers, Python/TypeScript functions & classes, YAML configs, and PDF files.
   - Extracts domain entities (`Service`, `ADR`, `Incident`, `ErrorCode`, `Config`, `Database`) and relational edges (`CALLS`, `DEPENDS_ON`, `CONFIGURED_BY`, `CAUSES`, `RESOLVED_BY`).

2. **Tri-Modal Hybrid Retrieval & Fusion**:
   - **Dense Vector Search**: Powered by Qdrant (with seamless in-memory fallback).
   - **Keyword Search**: BM25Okapi with technical token boosting for error codes, endpoints, and configs.
   - **Knowledge Graph Traversal**: Multi-hop entity and neighborhood expansion powered by Neo4j.
   - **Reciprocal Rank Fusion (RRF)**: $RRF(d) = \sum_{m \in M} \frac{w_m}{k + r_m(d)}$.

3. **Cross-Encoder Style Reranking**:
   - Calibrates semantic overlap and query-context relevance before passing the most pertinent snippets to the LLM.

4. **Source-Grounded Generation & Guardrails**:
   - Strict `[SOURCE-i]` citation tracking.
   - Groundedness validation and confidence scoring (HIGH / MEDIUM / LOW / UNRELIABLE).
   - Explicit rejection of unsupported claims if evidence is insufficient.
   - Contradiction detection across disparate documentation sources.

5. **Deep Observability & Debugger**:
   - Interactive **Retrieval Debugger** comparing Vector, BM25, Graph, Fusion, and Reranked candidates.
   - **Knowledge Graph Explorer** with interactive SVG/Canvas node visualizer.
   - **Evaluation Suite** computing Precision@k, Recall@k, MRR, Groundedness Score, and Citation Precision against benchmark suites.

---

## 🏗️ System Architecture

```
User / Engineer
     ↓
Next.js 14 Web App (TypeScript + Tailwind CSS + Lucide)
     ↓
FastAPI Backend (/api/v1)
 ├── Ingestion Pipeline (Parsers → Chunkers → Entity Extractor)
 ├── Retrieval Engine:
 │    ├── Vector Retriever (Qdrant)
 │    ├── Keyword Retriever (BM25Okapi)
 │    ├── Graph Retriever (Neo4j)
 │    ├── Hybrid Fusion (RRF)
 │    └── Cross-Encoder Reranker
 ├── Grounded Generator & Guardrails (LLM + Citations + Confidence)
 └── Evaluation Framework (Precision@k, Recall@k, MRR, Faithfulness)
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup

```bash
# Navigate to project root
cd ekis

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run automated tests
python3 -m pytest backend/tests/ -v

# Start FastAPI backend
uvicorn backend.app.main:app --reload --port 8000
```
API Documentation: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
# In another terminal window:
cd ekis/frontend

# Install dependencies
npm install

# Build & run Next.js
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🐳 Docker Compose Setup

Run the entire cluster (FastAPI, Next.js, Qdrant, and Neo4j) with a single command:

```bash
docker-compose up --build
```

---

## 📊 Sample Engineering Benchmark Queries

Try asking these questions in the Query Console:
- *Why is the authentication service returning 401 errors after deployment?*
- *What is the token expiration TTL and key rotation policy specified in ADR-004?*
- *How should engineers mitigate an unauthorized token verification loop in the API gateway?*
