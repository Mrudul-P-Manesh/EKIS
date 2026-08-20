import os
import uuid
from typing import Dict, Any, List, Optional
from backend.app.models.schemas import (
    Document, DocumentChunk, DocumentMetadata, IngestionRequest, IngestionResponse, GraphSubgraph
)
from backend.app.ingestion.parsers import DocumentParser
from backend.app.ingestion.chunkers import DocumentAwareChunker
from backend.app.ingestion.entity_extractor import EngineeringEntityExtractor
from backend.app.retrieval.vector_retriever import vector_retriever
from backend.app.retrieval.bm25_retriever import bm25_retriever
from backend.app.retrieval.graph_retriever import graph_retriever
from backend.app.core.database import metadata_db
from backend.app.core.logging import logger


class IngestionPipeline:
    """Coordinates parsing, chunking, graph extraction, vector indexing, and persistence."""

    def __init__(self):
        self.chunker = DocumentAwareChunker()
        self.entity_extractor = EngineeringEntityExtractor()

    def ingest_document(self, req: IngestionRequest) -> IngestionResponse:
        doc_id = str(uuid.uuid4())
        
        # 1. Parse / Prepare Document Metadata
        metadata = DocumentMetadata(
            source_type=req.source_type,
            file_name=req.file_name,
            service_name=req.service_name,
            tags=req.tags,
            custom_attributes=req.custom_attributes
        )

        # 2. Chunk document
        chunks = self.chunker.chunk_document(
            doc_id=doc_id,
            content=req.content,
            metadata=metadata
        )

        # 3. Extract Knowledge Graph Entities & Relations across all chunks
        full_subgraph = GraphSubgraph()
        for chunk in chunks:
            chunk_subgraph = self.entity_extractor.extract_from_text(
                text=chunk.content,
                doc_id=doc_id,
                chunk_id=chunk.chunk_id
            )
            full_subgraph.nodes.extend(chunk_subgraph.nodes)
            full_subgraph.edges.extend(chunk_subgraph.edges)

        # Deduplicate graph nodes
        unique_nodes = {n.id: n for n in full_subgraph.nodes}
        full_subgraph.nodes = list(unique_nodes.values())

        # 4. Save to Metadata DB
        doc_data = {
            "doc_id": doc_id,
            "title": req.title,
            "content": req.content,
            "source_type": req.source_type,
            "file_name": req.file_name,
            "service_name": req.service_name,
            "tags": req.tags,
            "custom_attributes": req.custom_attributes
        }
        chunks_data = [
            {
                "chunk_id": c.chunk_id,
                "doc_id": c.doc_id,
                "content": c.content,
                "chunk_index": c.chunk_index,
                "start_char": c.start_char,
                "end_char": c.end_char,
                "section_heading": c.section_heading,
                "metadata": c.metadata.model_dump() if hasattr(c.metadata, "model_dump") else c.metadata
            }
            for c in chunks
        ]
        metadata_db.save_document(doc_data, chunks_data)

        # 5. Index into Vector DB
        vector_retriever.index_chunks(chunks)

        # 6. Index into BM25 Keyword Index
        bm25_retriever.index_chunks(chunks)

        # 7. Index into Knowledge Graph DB
        graph_retriever.add_subgraph(full_subgraph)

        logger.info(
            f"Successfully ingested doc {doc_id} ('{req.title}'): "
            f"{len(chunks)} chunks, {len(full_subgraph.nodes)} nodes, {len(full_subgraph.edges)} edges."
        )

        return IngestionResponse(
            doc_id=doc_id,
            title=req.title,
            chunks_count=len(chunks),
            entities_extracted=len(full_subgraph.nodes),
            relationships_extracted=len(full_subgraph.edges),
            indexed_in_vector_db=True,
            indexed_in_keyword_index=True,
            indexed_in_graph_db=True,
            status="success",
            message=f"Ingested '{req.title}' with {len(chunks)} chunks and {len(full_subgraph.nodes)} graph entities."
        )

    def ingest_file(self, file_path: str, service_name: Optional[str] = None) -> IngestionResponse:
        parsed = DocumentParser.parse_file(file_path)
        req = IngestionRequest(
            title=parsed["title"],
            content=parsed["content"],
            source_type=parsed["metadata"]["source_type"],
            file_name=parsed["metadata"]["file_name"],
            service_name=service_name,
            custom_attributes=parsed["metadata"]
        )
        return self.ingest_document(req)


ingestion_pipeline = IngestionPipeline()
