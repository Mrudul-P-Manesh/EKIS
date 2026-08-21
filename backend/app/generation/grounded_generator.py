import time
from typing import Optional, List
from backend.app.config import settings
from backend.app.models.schemas import (
    QueryRequest, AnswerResponse, RetrievedChunk, ConfidenceIndicator, ConfidenceLevel
)
from backend.app.retrieval.hybrid_retriever import hybrid_retriever
from backend.app.retrieval.reranker import reranker
from backend.app.generation.context_builder import context_builder
from backend.app.generation.prompt_templates import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from backend.app.generation.llm_service import llm_service
from backend.app.generation.guardrails import guardrails
from backend.app.core.logging import logger


class GroundedGenerator:
    """End-to-end grounded generation pipeline with retrieval relevance validation, hybrid retrieval, reranking, and guardrails."""

    def _is_retrieval_relevant(self, query: str, chunks: List[RetrievedChunk]) -> tuple[bool, float, str]:
        """
        Validates whether retrieved chunks have sufficient relevance to the query.
        Returns: (is_relevant, top_score, reason)
        """
        if not chunks:
            return False, 0.0, "No documents matched retrieval criteria."

        top_score = max((c.score for c in chunks), default=0.0)

        # Check against minimum relevance threshold
        if top_score < settings.MIN_RELEVANCE_THRESHOLD:
            return False, top_score, f"Top relevance score ({top_score:.3f}) is below threshold ({settings.MIN_RELEVANCE_THRESHOLD})."

        # Check if all top chunks have 0.0 score (no keyword/semantic overlap)
        if all(c.score == 0.0 for c in chunks):
            return False, 0.0, "Zero term/semantic overlap with knowledge base."

        return True, top_score, "Retrieval confidence validated."

    def _build_refusal_response(self, req: QueryRequest, debug_trace, top_score: float, reason: str, latency_ms: float) -> AnswerResponse:
        """Construct a clean refusal response without invoking LLM."""
        logger.warning(
            f"Query refused | query='{req.query}' | top_score={top_score:.3f} | reason='{reason}'"
        )

        return AnswerResponse(
            query=req.query,
            direct_answer=settings.OUT_OF_DOMAIN_REFUSAL_MESSAGE,
            detailed_explanation="The indexed engineering documentation, architecture decision records (ADRs), runbooks, and source code do not contain information related to this question. Please ensure your query relates to the indexed systems or ingest the relevant technical documentation.",
            evidence_summary="No relevant documentation or source code found matching the query.",
            citations=[],
            confidence=ConfidenceIndicator(
                score=round(top_score, 3) if top_score > 0 else 0.0,
                level=ConfidenceLevel.UNRELIABLE,
                reasoning=f"Query rejected: {reason}",
                is_sufficient_evidence=False,
                contradictions_found=[]
            ),
            related_services=[],
            related_entities=[],
            retrieved_sources=[],
            debug_trace=debug_trace,
            latency_ms=latency_ms
        )

    async def answer_query_async(self, req: QueryRequest) -> AnswerResponse:
        start_time = time.time()

        # 1. Hybrid Retrieval (Vector + BM25 + Knowledge Graph)
        fused_results, debug_trace = hybrid_retriever.retrieve(
            query=req.query,
            top_k=req.top_k,
            use_vector=req.use_vector,
            use_bm25=req.use_bm25,
            use_graph=req.use_graph,
            filter_service=req.filter_service,
            filter_source_type=req.filter_source_type
        )

        # 2. Cross-Encoder Reranking
        if req.use_reranker and fused_results:
            reranked_chunks = reranker.rerank(req.query, fused_results)
        else:
            reranked_chunks = [
                RetrievedChunk(
                    chunk_id=c.chunk_id,
                    doc_id=c.doc_id,
                    content=c.content,
                    source_type=c.metadata.get("source_type", "markdown"),
                    file_name=c.metadata.get("file_name", "unknown"),
                    service_name=c.metadata.get("service_name"),
                    section_heading=c.metadata.get("section_heading"),
                    score=c.rrf_score,
                    retrieval_source="hybrid",
                    metadata=c.metadata
                )
                for c in fused_results[:req.top_k]
            ]

        debug_trace.reranked_results = reranked_chunks

        # 3. Relevance Validation & Out-of-domain Rejection Check
        is_relevant, top_score, reason = self._is_retrieval_relevant(req.query, reranked_chunks)
        total_latency_ms = round((time.time() - start_time) * 1000.0, 2)

        if not is_relevant:
            return self._build_refusal_response(req, debug_trace, top_score, reason, total_latency_ms)

        # Filter chunks to only those that meet relevance threshold
        valid_chunks = [c for c in reranked_chunks if c.score >= settings.MIN_RELEVANCE_THRESHOLD]
        if not valid_chunks:
            return self._build_refusal_response(req, debug_trace, top_score, "No individual chunks met the minimum relevance threshold.", total_latency_ms)

        # 4. Context & Citations Assembly
        context_text, available_citations = context_builder.build_context(
            chunks=valid_chunks,
            graph_results=debug_trace.graph_results
        )

        # 5. LLM Generation
        user_prompt = USER_PROMPT_TEMPLATE.format(query=req.query, context=context_text)
        raw_llm_output = await llm_service.generate_json_async(SYSTEM_PROMPT, user_prompt)

        # 6. Guardrails & Validation
        refined_output, active_citations, confidence = guardrails.validate_and_refine(
            llm_response=raw_llm_output,
            available_citations=available_citations,
            retrieved_chunks=valid_chunks
        )

        total_latency_ms = round((time.time() - start_time) * 1000.0, 2)

        return AnswerResponse(
            query=req.query,
            direct_answer=refined_output.get("direct_answer", ""),
            detailed_explanation=refined_output.get("detailed_explanation", ""),
            evidence_summary=refined_output.get("evidence_summary", ""),
            citations=active_citations,
            confidence=confidence,
            related_services=refined_output.get("related_services", []),
            related_entities=refined_output.get("related_entities", []),
            retrieved_sources=valid_chunks if confidence.is_sufficient_evidence else [],
            debug_trace=debug_trace,
            latency_ms=total_latency_ms
        )

    def answer_query(self, req: QueryRequest) -> AnswerResponse:
        """Sync wrapper."""
        start_time = time.time()

        fused_results, debug_trace = hybrid_retriever.retrieve(
            query=req.query,
            top_k=req.top_k,
            use_vector=req.use_vector,
            use_bm25=req.use_bm25,
            use_graph=req.use_graph,
            filter_service=req.filter_service,
            filter_source_type=req.filter_source_type
        )

        if req.use_reranker and fused_results:
            reranked_chunks = reranker.rerank(req.query, fused_results)
        else:
            reranked_chunks = [
                RetrievedChunk(
                    chunk_id=c.chunk_id,
                    doc_id=c.doc_id,
                    content=c.content,
                    source_type=c.metadata.get("source_type", "markdown"),
                    file_name=c.metadata.get("file_name", "unknown"),
                    service_name=c.metadata.get("service_name"),
                    section_heading=c.metadata.get("section_heading"),
                    score=c.rrf_score,
                    retrieval_source="hybrid",
                    metadata=c.metadata
                )
                for c in fused_results[:req.top_k]
            ]

        debug_trace.reranked_results = reranked_chunks

        is_relevant, top_score, reason = self._is_retrieval_relevant(req.query, reranked_chunks)
        total_latency_ms = round((time.time() - start_time) * 1000.0, 2)

        if not is_relevant:
            return self._build_refusal_response(req, debug_trace, top_score, reason, total_latency_ms)

        valid_chunks = [c for c in reranked_chunks if c.score >= settings.MIN_RELEVANCE_THRESHOLD]
        if not valid_chunks:
            return self._build_refusal_response(req, debug_trace, top_score, "No individual chunks met the minimum relevance threshold.", total_latency_ms)

        context_text, available_citations = context_builder.build_context(
            chunks=valid_chunks,
            graph_results=debug_trace.graph_results
        )

        user_prompt = USER_PROMPT_TEMPLATE.format(query=req.query, context=context_text)
        raw_llm_output = llm_service.generate_json(SYSTEM_PROMPT, user_prompt)

        refined_output, active_citations, confidence = guardrails.validate_and_refine(
            llm_response=raw_llm_output,
            available_citations=available_citations,
            retrieved_chunks=valid_chunks
        )

        total_latency_ms = round((time.time() - start_time) * 1000.0, 2)

        return AnswerResponse(
            query=req.query,
            direct_answer=refined_output.get("direct_answer", ""),
            detailed_explanation=refined_output.get("detailed_explanation", ""),
            evidence_summary=refined_output.get("evidence_summary", ""),
            citations=active_citations,
            confidence=confidence,
            related_services=refined_output.get("related_services", []),
            related_entities=refined_output.get("related_entities", []),
            retrieved_sources=valid_chunks if confidence.is_sufficient_evidence else [],
            debug_trace=debug_trace,
            latency_ms=total_latency_ms
        )


grounded_generator = GroundedGenerator()
