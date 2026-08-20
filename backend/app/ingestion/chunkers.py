import re
import uuid
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import DocumentChunk, DocumentMetadata


class DocumentAwareChunker:
    """Structure-aware chunker that preserves semantic boundaries across markdown, code, and text."""

    def __init__(self, target_chunk_size: int = 800, chunk_overlap: int = 150):
        self.target_chunk_size = target_chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(self, doc_id: str, content: str, metadata: DocumentMetadata) -> List[DocumentChunk]:
        source_type = metadata.source_type.lower()
        if source_type in ["markdown", "adr", "postmortem", "runbook"]:
            return self._chunk_markdown(doc_id, content, metadata)
        elif source_type == "code":
            return self._chunk_code(doc_id, content, metadata)
        else:
            return self._chunk_sliding_window(doc_id, content, metadata)

    def _chunk_markdown(self, doc_id: str, content: str, metadata: DocumentMetadata) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []
        # Split by markdown headers (#, ##, ###, ####)
        header_pattern = re.compile(r"(^#{1,4}\s+.+$)", re.MULTILINE)
        splits = list(header_pattern.finditer(content))

        if not splits:
            return self._chunk_sliding_window(doc_id, content, metadata)

        sections = []
        # Check text before first header
        if splits[0].start() > 0:
            sections.append(("Introduction", content[:splits[0].start()], 0, splits[0].start()))

        for i, match in enumerate(splits):
            header = match.group(1).strip()
            start_pos = match.start()
            end_pos = splits[i + 1].start() if i + 1 < len(splits) else len(content)
            section_body = content[start_pos:end_pos]
            sections.append((header, section_body, start_pos, end_pos))

        chunk_idx = 0
        for header, sec_text, sec_start, sec_end in sections:
            if len(sec_text.strip()) == 0:
                continue

            if len(sec_text) <= self.target_chunk_size + 100:
                chunk = DocumentChunk(
                    chunk_id=f"{doc_id}_chunk_{chunk_idx}",
                    doc_id=doc_id,
                    content=sec_text.strip(),
                    chunk_index=chunk_idx,
                    start_char=sec_start,
                    end_char=sec_end,
                    section_heading=header,
                    metadata=metadata,
                    token_count=len(sec_text.split())
                )
                chunks.append(chunk)
                chunk_idx += 1
            else:
                # Subdivide section if too large
                sub_chunks = self._split_text_with_overlap(sec_text, self.target_chunk_size, self.chunk_overlap)
                for rel_start, rel_end, sub_content in sub_chunks:
                    chunk = DocumentChunk(
                        chunk_id=f"{doc_id}_chunk_{chunk_idx}",
                        doc_id=doc_id,
                        content=f"{header}\n\n{sub_content}".strip(),
                        chunk_index=chunk_idx,
                        start_char=sec_start + rel_start,
                        end_char=sec_start + rel_end,
                        section_heading=header,
                        metadata=metadata,
                        token_count=len(sub_content.split())
                    )
                    chunks.append(chunk)
                    chunk_idx += 1

        return chunks

    def _chunk_code(self, doc_id: str, content: str, metadata: DocumentMetadata) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []
        lines = content.splitlines(keepends=True)
        
        current_chunk_lines: List[str] = []
        current_length = 0
        current_start_char = 0
        char_counter = 0
        chunk_idx = 0
        current_heading = "Module Root"

        for line in lines:
            # Check if this line is a function or class definition
            def_match = re.match(r"^(?:async\s+)?(?:def|class|function|const|export)\s+([a-zA-Z0-9_]+)", line)
            if def_match:
                current_heading = f"Symbol: {def_match.group(1)}"

            current_chunk_lines.append(line)
            current_length += len(line)
            char_counter += len(line)

            if current_length >= self.target_chunk_size:
                chunk_text = "".join(current_chunk_lines).strip()
                if chunk_text:
                    chunks.append(DocumentChunk(
                        chunk_id=f"{doc_id}_chunk_{chunk_idx}",
                        doc_id=doc_id,
                        content=chunk_text,
                        chunk_index=chunk_idx,
                        start_char=current_start_char,
                        end_char=char_counter,
                        section_heading=current_heading,
                        metadata=metadata,
                        token_count=len(chunk_text.split())
                    ))
                    chunk_idx += 1

                # Keep overlap lines
                overlap_lines = current_chunk_lines[-4:] if len(current_chunk_lines) > 4 else []
                current_chunk_lines = list(overlap_lines)
                current_length = sum(len(l) for l in overlap_lines)
                current_start_char = char_counter - current_length

        if current_chunk_lines:
            chunk_text = "".join(current_chunk_lines).strip()
            if chunk_text:
                chunks.append(DocumentChunk(
                    chunk_id=f"{doc_id}_chunk_{chunk_idx}",
                    doc_id=doc_id,
                    content=chunk_text,
                    chunk_index=chunk_idx,
                    start_char=current_start_char,
                    end_char=char_counter,
                    section_heading=current_heading,
                    metadata=metadata,
                    token_count=len(chunk_text.split())
                ))

        return chunks

    def _chunk_sliding_window(self, doc_id: str, content: str, metadata: DocumentMetadata) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []
        sub_chunks = self._split_text_with_overlap(content, self.target_chunk_size, self.chunk_overlap)
        
        for idx, (start_char, end_char, chunk_text) in enumerate(sub_chunks):
            chunks.append(DocumentChunk(
                chunk_id=f"{doc_id}_chunk_{idx}",
                doc_id=doc_id,
                content=chunk_text,
                chunk_index=idx,
                start_char=start_char,
                end_char=end_char,
                section_heading=None,
                metadata=metadata,
                token_count=len(chunk_text.split())
            ))
        return chunks

    def _split_text_with_overlap(self, text: str, chunk_size: int, overlap: int) -> List[tuple]:
        results = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + chunk_size, text_len)
            
            # If we're not at the very end, try to snap to word/paragraph boundary
            if end < text_len:
                newline_pos = text.rfind("\n\n", start, end)
                if newline_pos != -1 and newline_pos > start + (chunk_size // 2):
                    end = newline_pos + 2
                else:
                    space_pos = text.rfind(" ", start, end)
                    if space_pos != -1 and space_pos > start + (chunk_size // 2):
                        end = space_pos + 1

            chunk_content = text[start:end].strip()
            if chunk_content:
                results.append((start, end, chunk_content))

            if end >= text_len:
                break
            start = max(end - overlap, start + 1)

        return results
