import pytest
from backend.app.ingestion.parsers import DocumentParser
from backend.app.ingestion.chunkers import DocumentAwareChunker
from backend.app.models.schemas import DocumentMetadata


def test_markdown_parser():
    sample_md = """# Architecture Overview
This is the root architecture document.

## Microservices
We have auth-service, gateway, and user-service.

### Failure Modes
Uncoordinated key rotation causes 401 errors.
"""
    parsed = DocumentParser.parse_markdown(sample_md, "architecture.md", is_content=True)
    assert parsed["title"] == "Architecture Overview"
    assert "headings" in parsed["metadata"]
    assert len(parsed["metadata"]["headings"]) >= 3


def test_code_parser():
    sample_py = """
class TokenVerifier:
    def __init__(self, key):
        self.key = key

    async def verify(self, token):
        return True
"""
    parsed = DocumentParser.parse_code(sample_py, "token_verifier.py", is_content=True)
    assert parsed["metadata"]["source_type"] == "code"
    assert "TokenVerifier" in parsed["metadata"]["symbols"]


def test_structure_aware_chunker():
    chunker = DocumentAwareChunker(target_chunk_size=120, chunk_overlap=30)
    meta = DocumentMetadata(source_type="markdown", file_name="test.md")
    
    content = """# Section 1: Introduction
This is the introduction explaining the background of the auth service.

## Section 2: Key Rotation
Key rotation runs every 30 days pursuant to ADR-004.

## Section 3: Mitigation
Flush the cache via /admin/cache/refresh to resolve 401 errors.
"""
    chunks = chunker.chunk_document("doc-1", content, meta)
    assert len(chunks) >= 3
    assert any("Key Rotation" in (c.section_heading or "") for c in chunks)
    assert all(c.doc_id == "doc-1" for c in chunks)
