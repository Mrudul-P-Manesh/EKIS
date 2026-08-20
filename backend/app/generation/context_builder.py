from typing import List, Dict, Any, Tuple
from backend.app.models.schemas import RetrievedChunk, Citation, GraphSearchResult


class ContextBuilder:
    """Formats retrieved chunks and graph paths into numbered [SOURCE-i] contexts for grounded generation."""

    def build_context(
        self,
        chunks: List[RetrievedChunk],
        graph_results: List[GraphSearchResult]
    ) -> Tuple[str, List[Citation]]:
        context_blocks = []
        citations_map: List[Citation] = []

        # 1. Format document chunks
        for idx, chunk in enumerate(chunks, 1):
            source_tag = f"[SOURCE-{idx}]"
            meta = chunk.metadata or {}
            file_name = chunk.file_name or meta.get("file_name", "unknown")
            source_type = chunk.source_type or meta.get("source_type", "document")
            heading = chunk.section_heading or meta.get("section_heading", "General")
            srv_name = chunk.service_name or meta.get("service_name")

            header_line = f"--- {source_tag} | File: {file_name} | Type: {source_type} | Section: {heading} ---"
            if srv_name:
                header_line += f" | Service: {srv_name}"

            block = f"{header_line}\n{chunk.content.strip()}\n"
            context_blocks.append(block)

            citations_map.append(Citation(
                citation_id=idx,
                source_tag=source_tag,
                doc_id=chunk.doc_id,
                chunk_id=chunk.chunk_id,
                file_name=file_name,
                source_type=source_type,
                section_heading=heading,
                service_name=srv_name,
                exact_quote_or_span=chunk.content[:160] + "...",
                confidence=chunk.score
            ))

        # 2. Format knowledge graph context
        if graph_results:
            graph_lines = ["--- Knowledge Graph Relationships ---"]
            for g in graph_results:
                graph_lines.append(f"Entity: {g.entity_label} ({g.entity_type}) | Path: {g.relationship_path}")
            context_blocks.append("\n".join(graph_lines))

        full_context_text = "\n\n".join(context_blocks)
        return full_context_text, citations_map


context_builder = ContextBuilder()
