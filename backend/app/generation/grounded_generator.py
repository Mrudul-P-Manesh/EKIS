import time
from typing import Optional
from backend.app.models.schemas import QueryRequest, AnswerResponse, RetrievedChunk
from backend.app.retrieval.hybrid_retriever import hybrid_retriever
from backend.app.retrieval.reranker import reranker
from backend.app.generation.context_builder import context_builder
from backend.app.generation.prompt_templates import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from backend.app.generation.llm_service import llm_service
from backend.app.generation.guardrails import guardrails
from backend.app.core.logging import logger


class GroundedGenerator:
    """End-to-end grounded generation pipeline with hybrid retrieval, reranking, and guardrails."""

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

        # 3. Context & Citations Assembly
        context_text, available_citations = context_builder.build_context(
            chunks=reranked_chunks,
            graph_results=debug_trace.graph_results
        )

        # 4. LLM Generation
        user_prompt = USER_PROMPT_TEMPLATE.format(query=req.query, context=context_text)
        raw_llm_output = await llm_service.generate_json_async(SYSTEM_PROMPT, user_prompt)

        # 5. Guardrails & Validation
        refined_output, active_citations, confidence = guardrails.validate_and_refine(
            llm_response=raw_llm_output,
            available_citations=available_citations,
            retrieved_chunks=reranked_chunks
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
            retrieved_sources=reranked_chunks,
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

        context_text, available_citations = context_builder.build_context(
            chunks=reranked_chunks,
            graph_results=debug_trace.graph_results
        )

        user_prompt = USER_PROMPT_TEMPLATE.format(query=req.query, context=context_text)
        raw_llm_output = llm_service.generate_json(SYSTEM_PROMPT, user_prompt)

        refined_output, active_citations, confidence = guardrails.validate_and_refine(
            llm_response=raw_llm_output,
            available_citations=available_citations,
            retrieved_chunks=reranked_chunks
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
            retrieved_sources=reranked_chunks,
            debug_trace=debug_trace,
            latency_ms=total_latency_ms
        )


grounded_generator = GroundedGenerator()
