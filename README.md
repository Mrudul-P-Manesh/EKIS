# Engineering Knowledge Intelligence System

Engineering Knowledge Intelligence System (EKIS) is a production-oriented Retrieval-Augmented Generation (RAG) platform designed to help engineers interact with technical knowledge bases using natural language.

EKIS combines semantic search, keyword search, knowledge graphs, reranking, grounded generation, source citations, and RAG evaluation into a single system.

The project is designed to demonstrate practical RAG engineering using LangChain, Qdrant, Neo4j, BM25, cross-encoder reranking, FastAPI, and Next.js.

---

## Overview

Engineering teams work with large amounts of technical information distributed across:

- Architecture documentation
- API documentation
- Source code
- Configuration files
- Troubleshooting guides
- Deployment documentation
- Engineering issues
- Project repositories

Finding relevant information across these sources can be time-consuming.

EKIS provides a unified interface where engineers can ask questions such as:

> Why is the authentication service returning HTTP 401 errors after deployment?

Instead of relying solely on the knowledge stored inside an LLM, EKIS retrieves relevant information from the indexed engineering knowledge base and uses that evidence to generate a grounded response.

The system also provides citations, confidence information, retrieval traces, and knowledge-graph relationships so that generated answers can be inspected and verified.

---

## Core Architecture

```text
                         User Query
                             |
                             v
                    Query Understanding
                             |
                             v
                    Retrieval Router
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
           Qdrant          BM25           Neo4j
        Semantic Search  Keyword Search  Graph Search
              |              |              |
              +--------------+--------------+
                             |
                             v
                   RRF + Deduplication
                             |
                             v
                       Cross-Encoder
                         Reranking
                             |
                             v
                    Context Construction
                             |
                             v
                   Grounded LLM Generation
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
          Citations      Guardrails      Confidence
              |              |              |
              +--------------+--------------+
                             |
                             v
                  Structured RAG Response
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
           Answer        Sources       Debug Trace
```

---

## Key Features

### Hybrid Retrieval

EKIS combines three retrieval strategies:

- Vector retrieval using Qdrant
- Keyword retrieval using BM25
- Graph retrieval using Neo4j

This allows the system to handle semantic questions, exact technical identifiers, and relationship-based queries.

### Semantic Search

Qdrant stores vector representations of document chunks.

This allows EKIS to retrieve conceptually similar information even when the user's wording differs from the original document.

### Keyword Search

BM25 provides exact and lexical retrieval for identifiers that are particularly important in engineering environments.

Examples include:

```text
JWT_SECRET
HTTP 401
RedisConnectionError
/api/login
AuthMiddleware
ISSUE-142
```

### Knowledge Graph

Neo4j represents relationships between engineering entities.

Example:

```text
AuthService
    |
    +-- USES --> Redis
    |
    +-- USES --> JWT
    |
    +-- IMPLEMENTED_BY --> auth_middleware.py
    |
    +-- EXPOSES --> /api/login
    |
    +-- RELATED_TO --> ISSUE-142
```

This allows EKIS to answer questions that require understanding relationships between systems and components.

### Reranking

Retrieved results are passed through a cross-encoder reranker to identify the most relevant evidence before generation.

### Grounded Generation

The LLM receives retrieved evidence instead of being allowed to answer purely from its pretrained knowledge.

Generated answers contain source references so users can verify the information.

### Hallucination Protection

If the system cannot find sufficient evidence, it does not fabricate an answer.

It can instead return:

```text
I don't have enough reliable evidence in the indexed
knowledge base to answer this question.
```

The system can also identify conflicting information between sources.

### Retrieval Debugger

EKIS exposes the internal RAG pipeline through a developer-oriented debugging interface.

The debugger can display:

```text
Query
Query Classification
Extracted Entities
Vector Results
BM25 Results
Graph Results
RRF Results
Reranker Scores
Final Context
LLM Latency
Total Latency
```

### Knowledge Graph Visualization

The Neo4j knowledge graph can be explored through an interactive frontend interface.

Users can inspect:

- Entities
- Relationships
- Services
- APIs
- Files
- Issues
- Technologies
- Dependencies

### Evaluation

EKIS includes a benchmark evaluation system for measuring RAG quality.

Metrics include:

- Recall@K
- Precision@K
- Mean Reciprocal Rank
- Hit Rate
- Faithfulness
- Answer Relevance
- Context Relevance
- Citation Accuracy
- Retrieval Latency
- Generation Latency
- P50 Latency
- P95 Latency

---

## Technology Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy

### RAG

- LangChain
- Qdrant
- BM25
- Neo4j
- Cross-Encoder Reranking

### AI

- OpenAI-compatible LLM providers
- Configurable embedding models

### Data

- PostgreSQL
- Qdrant
- Neo4j

### Infrastructure

- Docker
- Docker Compose

### Testing

- Pytest
- Integration tests
- RAG evaluation benchmarks

---

## Supported Knowledge Sources

EKIS is designed to process:

- PDF documents
- Markdown documents
- TXT files
- Python source code
- JavaScript / TypeScript source code
- Go source code
- Java source code
- YAML configuration files
- Engineering issues
- Repository documentation

Each indexed document receives metadata that allows the system to trace retrieved information back to its original source.

---

## Ingestion Pipeline

```text
Document
    |
    v
File Validation
    |
    v
Document Parser
    |
    v
Structure-Aware Chunking
    |
    +-------------------+
    |                   |
    v                   v
Embeddings        Entity Extraction
    |                   |
    v                   v
Qdrant              Neo4j
    |
    v
BM25 Index
    |
    v
PostgreSQL Metadata
```

### Structure-Aware Chunking

EKIS does not treat every document as an arbitrary sequence of characters.

The chunking system preserves document structure such as:

```text
Architecture
    |
    +-- Authentication
          |
          +-- Token Validation
          |
          +-- JWT Configuration
```

Source code chunks can preserve:

- File paths
- Classes
- Functions
- Methods
- Line numbers
- Programming language
- Imports

This metadata is later used for retrieval and citations.

---

## Engineering Knowledge Graph

EKIS uses an engineering-oriented ontology.

### Entity Types

```text
Service
Repository
File
Function
Class
API
Database
Technology
Issue
Error
Configuration
```

### Relationship Types

```text
DEFINES
CALLS
USES
EXPOSES
DOCUMENTED_IN
AFFECTS
RELATED_TO
```

Example:

```text
Repository
    |
    +-- CONTAINS --> File
                       |
                       +-- DEFINES --> Function
                                          |
                                          +-- CALLS --> Function

Service
    |
    +-- USES --> Database
    |
    +-- EXPOSES --> API

Issue
    |
    +-- AFFECTS --> Service
```

---

## Hybrid Retrieval

EKIS uses multiple retrieval strategies because no single retrieval method is optimal for every engineering query.

### Vector Retrieval

Useful for:

```text
What causes authentication failures during deployment?
```

### BM25 Retrieval

Useful for:

```text
Where is JWT_SECRET configured?
```

### Graph Retrieval

Useful for:

```text
Which services depend on Redis?
```

### Hybrid Retrieval

Useful for complex questions such as:

```text
Why could AuthService return HTTP 401 after deployment?
```

The system combines the results using Reciprocal Rank Fusion.

A simplified scoring function is:

```text
RRF(d) =
    wv / (k + rank_vector(d))
  + wb / (k + rank_bm25(d))
  + wg / (k + rank_graph(d))
```

The resulting candidates are then reranked before being passed to the LLM.

---

## Grounded Answer Generation

The generation pipeline uses explicitly tagged sources.

Example:

```text
[SOURCE-1]
File: auth_middleware.py
Lines: 42-60

[SOURCE-2]
Document: deployment_guide.md
Section: Authentication

[SOURCE-3]
Issue: ISSUE-142
```

The generated response contains structured information such as:

```json
{
  "answer": "The authentication service may return HTTP 401 when the JWT configuration used during deployment does not match the expected signing secret.",
  "confidence": 0.92,
  "confidence_level": "High",
  "citations": [
    {
      "source_id": "SOURCE-1",
      "filename": "auth_middleware.py",
      "line_range": "L42-L60"
    }
  ],
  "related_entities": [
    "AuthService",
    "JWT",
    "Redis"
  ],
  "conflicts_detected": [],
  "insufficient_evidence": false
}
```

The system does not expose hidden model reasoning. Instead, it provides a concise evidence-based summary of why the answer was generated.

---

## Project Structure

```text
ekis/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── ingestion/
│   │   ├── retrieval/
│   │   ├── rag/
│   │   ├── graph/
│   │   ├── evaluation/
│   │   └── main.py
│   │
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── types/
│   ├── package.json
│   └── Dockerfile
│
├── data/
│   └── sample/
│       ├── docs/
│       ├── code/
│       ├── troubleshooting/
│       ├── issues/
│       └── evaluation_benchmark.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Application Pages

### Dashboard

Provides an overview of the system:

- Indexed documents
- Indexed chunks
- Graph nodes
- Graph relationships
- Query count
- Retrieval latency
- Response latency
- Confidence distribution

### Query Interface

Allows engineers to ask technical questions and view:

- Generated answer
- Confidence level
- Citations
- Related entities
- Source previews
- Conflicting evidence

### Documents

Provides:

- Document upload
- Document listing
- Ingestion status
- Chunk inspection
- Metadata inspection
- Document deletion

### Knowledge Graph

Provides interactive exploration of:

- Nodes
- Relationships
- Services
- APIs
- Files
- Technologies
- Issues

### Evaluation

Provides:

- Benchmark execution
- Retrieval metrics
- Generation metrics
- Citation accuracy
- Latency measurements
- Historical evaluation results

### Settings

Provides configurable RAG parameters and model settings.

---

## API

Core backend endpoints include:

```text
POST   /api/documents/upload
GET    /api/documents
DELETE /api/documents/{id}

POST   /api/query
POST   /api/query/debug

GET    /api/graph
GET    /api/graph/entity/{id}

POST   /api/evaluation/run
GET    /api/evaluation/results

GET    /api/stats
GET    /api/health
```

---

## Local Development

### Prerequisites

Install:

- Python 3.11+
- Node.js 20+
- Docker
- Docker Compose

---

## Environment Configuration

Create a `.env` file based on `.env.example`.

Example:

```env
OPENAI_API_KEY=
LLM_MODEL=
EMBEDDING_MODEL=

QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=

POSTGRES_URL=
```

Do not commit `.env` or any credentials to version control.

---

## Running with Docker

Start the infrastructure and application:

```bash
docker compose up --build
```

The application will start the required services including:

```text
Frontend
Backend
PostgreSQL
Qdrant
Neo4j
```

---

## Backend Development

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Run the backend:

```bash
uvicorn backend.app.main:app --reload
```

---

## Frontend Development

Install dependencies:

```bash
cd frontend
npm install
```

Run the development server:

```bash
npm run dev
```

---

## Testing

Run backend tests:

```bash
pytest backend/tests
```

Build the frontend:

```bash
cd frontend
npm run build
```

The project should pass unit and integration tests before a stable Git checkpoint is created.

---

## Example Queries

### Semantic Query

```text
What is the purpose of AuthMiddleware?
```

### Exact Identifier Query

```text
Where is JWT_SECRET configured?
```

### Graph Query

```text
Which services depend on PostgreSQL?
```

### Troubleshooting Query

```text
Why is AuthService returning HTTP 401 after deployment?
```

### Multi-Hop Query

```text
Which service uses Redis through the authentication middleware and is associated with ISSUE-142?
```

---

## Evaluation Strategy

The project includes a benchmark dataset containing questions, expected answers, and expected sources.

The retrieval system is evaluated using:

```text
Recall@K
Precision@K
MRR
Hit Rate
```

Generated answers are evaluated using:

```text
Faithfulness
Answer Relevance
Context Relevance
Citation Accuracy
```

System performance is evaluated using:

```text
Retrieval Latency
Generation Latency
P50 Latency
P95 Latency
```

This allows retrieval and generation improvements to be measured objectively.

---

## Git Development Workflow

Development is performed incrementally using Git checkpoints.

Meaningful milestones should be committed independently rather than creating one large final commit.

Example:

```text
feat: implement structure-aware document chunking
feat: add Qdrant vector retrieval
feat: implement BM25 keyword search
feat: add Neo4j engineering graph
feat: implement hybrid retrieval with RRF
feat: add cross-encoder reranking
feat: implement grounded answer generation
feat: add citation validation
feat: implement retrieval debugger
test: add hybrid retrieval integration tests
fix: handle empty retrieval results
refactor: extract RAG orchestration service
docs: document retrieval architecture
```

Before pushing a stable checkpoint:

```bash
git status
git diff
pytest
npm run build
git add .
git commit -m "feat: ..."
git push
```

Sensitive files such as `.env`, API keys, passwords, and database credentials must never be committed.

---

## Design Principles

EKIS follows several core engineering principles:

### Evidence Before Generation

The system retrieves relevant evidence before generating an answer.

### Retrieval Diversity

Different retrieval mechanisms are used for different types of questions.

### Source Attribution

Important claims should be traceable to their original source.

### Explicit Uncertainty

The system should acknowledge insufficient or conflicting evidence.

### Observable Retrieval

Developers should be able to inspect how an answer was produced.

### Measurable Quality

RAG quality should be evaluated using measurable retrieval and generation metrics.

### Modular Architecture

Retrieval, ingestion, graph processing, generation, evaluation, and API layers should remain independently testable.

---

## Project Goals

The primary goals of EKIS are:

1. Build a practical hybrid RAG system.
2. Understand semantic, keyword, and graph retrieval.
3. Implement production-oriented document ingestion.
4. Learn how vector databases and knowledge graphs complement each other.
5. Implement grounded LLM generation.
6. Reduce hallucination through evidence validation.
7. Build observable and debuggable RAG pipelines.
8. Evaluate RAG quality using measurable metrics.
9. Develop a deployable full-stack AI application.

---

## Future Improvements

Potential future extensions include:

- GitHub API integration
- Jira integration
- Slack knowledge ingestion
- Incremental document indexing
- Background ingestion workers
- Query caching
- Advanced query rewriting
- Adaptive retrieval routing
- GraphRAG expansion
- Multi-tenant knowledge bases
- Role-based access control
- Document versioning
- Advanced reranking models
- RAG observability with LangSmith
- Kubernetes deployment

---

## License

This project is intended for educational
