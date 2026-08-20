import os
import re
from typing import Dict, Any, Optional
from pypdf import PdfReader
from backend.app.core.logging import logger


class DocumentParser:
    """Base parser and factory for engineering document types."""

    @staticmethod
    def parse_file(file_path: str, source_type: Optional[str] = None) -> Dict[str, Any]:
        ext = os.path.splitext(file_path)[1].lower()
        file_name = os.path.basename(file_path)

        if not source_type:
            if ext in [".md", ".markdown"]:
                source_type = "markdown"
            elif ext == ".pdf":
                source_type = "pdf"
            elif ext in [".py", ".ts", ".js", ".go", ".java", ".yaml", ".yml", ".json"]:
                source_type = "code"
            else:
                source_type = "txt"

        if source_type == "pdf":
            return DocumentParser.parse_pdf(file_path, file_name)
        elif source_type == "code":
            return DocumentParser.parse_code(file_path, file_name)
        elif source_type == "markdown":
            return DocumentParser.parse_markdown(file_path, file_name)
        else:
            return DocumentParser.parse_text(file_path, file_name)

    @staticmethod
    def parse_markdown(file_path_or_content: str, file_name: str = "document.md", is_content: bool = False) -> Dict[str, Any]:
        if is_content:
            content = file_path_or_content
        else:
            with open(file_path_or_content, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

        # Extract title from first # header or filename
        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else file_name.replace(".md", "").replace("_", " ").title()

        # Extract frontmatter metadata if available
        metadata: Dict[str, Any] = {
            "source_type": "markdown",
            "file_name": file_name,
            "headings": re.findall(r"^#{1,4}\s+(.+)$", content, re.MULTILINE)
        }

        # Check for ADR / Postmortem / Runbook patterns
        if "adr" in file_name.lower() or "architecture decision" in content.lower():
            metadata["source_type"] = "adr"
        elif "postmortem" in file_name.lower() or "incident" in file_name.lower() or "root cause" in content.lower():
            metadata["source_type"] = "postmortem"
        elif "runbook" in file_name.lower() or "playbook" in file_name.lower():
            metadata["source_type"] = "runbook"

        return {
            "title": title,
            "content": content,
            "metadata": metadata
        }

    @staticmethod
    def parse_pdf(file_path: str, file_name: str = "document.pdf") -> Dict[str, Any]:
        reader = PdfReader(file_path)
        pages_text = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            pages_text.append(f"--- Page {idx + 1} ---\n" + page_text)

        content = "\n\n".join(pages_text)
        title = file_name.replace(".pdf", "").replace("_", " ").title()

        return {
            "title": title,
            "content": content,
            "metadata": {
                "source_type": "pdf",
                "file_name": file_name,
                "page_count": len(reader.pages)
            }
        }

    @staticmethod
    def parse_code(file_path_or_content: str, file_name: str = "code.py", is_content: bool = False) -> Dict[str, Any]:
        if is_content:
            content = file_path_or_content
        else:
            with open(file_path_or_content, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

        ext = os.path.splitext(file_name)[1].lower()
        title = f"Code: {file_name}"

        # Extract symbols (functions, classes, endpoints)
        symbols = []
        if ext == ".py":
            symbols.extend(re.findall(r"^(?:async\s+)?def\s+([a-zA-Z0-9_]+)", content, re.MULTILINE))
            symbols.extend(re.findall(r"^class\s+([a-zA-Z0-9_]+)", content, re.MULTILINE))
        elif ext in [".js", ".ts"]:
            symbols.extend(re.findall(r"(?:function|const|let)\s+([a-zA-Z0-9_]+)\s*=", content))
            symbols.extend(re.findall(r"function\s+([a-zA-Z0-9_]+)", content))
            symbols.extend(re.findall(r"class\s+([a-zA-Z0-9_]+)", content))

        return {
            "title": title,
            "content": content,
            "metadata": {
                "source_type": "code",
                "file_name": file_name,
                "language": ext.lstrip("."),
                "symbols": symbols
            }
        }

    @staticmethod
    def parse_text(file_path_or_content: str, file_name: str = "document.txt", is_content: bool = False) -> Dict[str, Any]:
        if is_content:
            content = file_path_or_content
        else:
            with open(file_path_or_content, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

        return {
            "title": file_name.replace(".txt", "").replace("_", " ").title(),
            "content": content,
            "metadata": {
                "source_type": "txt",
                "file_name": file_name
            }
        }
