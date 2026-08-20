import os
import json
import sqlite3
from typing import Dict, Any, List, Optional
from backend.app.config import settings
from backend.app.core.logging import logger


class MetadataDatabase:
    """SQLite-backed metadata and document storage."""
    
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.DATABASE_URL.replace("sqlite:///", "")
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    doc_id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    file_path TEXT,
                    service_name TEXT,
                    version TEXT,
                    author TEXT,
                    tags TEXT,
                    custom_attributes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS document_chunks (
                    chunk_id TEXT PRIMARY KEY,
                    doc_id TEXT NOT NULL,
                    content TEXT NOT NULL,
                    chunk_index INTEGER NOT NULL,
                    start_char INTEGER,
                    end_char INTEGER,
                    section_heading TEXT,
                    metadata_json TEXT,
                    FOREIGN KEY (doc_id) REFERENCES documents (doc_id) ON DELETE CASCADE
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS evaluations (
                    id TEXT PRIMARY KEY,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    summary_json TEXT NOT NULL,
                    results_json TEXT NOT NULL
                )
            """)
            conn.commit()

    def save_document(self, doc_data: Dict[str, Any], chunks: List[Dict[str, Any]]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            tags = json.dumps(doc_data.get("tags", []), default=str)
            custom_attrs = json.dumps(doc_data.get("custom_attributes", {}), default=str)
            
            cursor.execute("""
                INSERT OR REPLACE INTO documents (
                    doc_id, title, content, source_type, file_name, file_path,
                    service_name, version, author, tags, custom_attributes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_data["doc_id"],
                doc_data["title"],
                doc_data["content"],
                doc_data.get("source_type", "markdown"),
                doc_data.get("file_name", "unknown"),
                doc_data.get("file_path"),
                doc_data.get("service_name"),
                doc_data.get("version", "1.0"),
                doc_data.get("author"),
                tags,
                custom_attrs
            ))

            for chunk in chunks:
                cursor.execute("""
                    INSERT OR REPLACE INTO document_chunks (
                        chunk_id, doc_id, content, chunk_index,
                        start_char, end_char, section_heading, metadata_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    chunk["chunk_id"],
                    chunk["doc_id"],
                    chunk["content"],
                    chunk["chunk_index"],
                    chunk.get("start_char", 0),
                    chunk.get("end_char", 0),
                    chunk.get("section_heading"),
                    json.dumps(chunk.get("metadata", {}), default=str)
                ))
            conn.commit()

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents WHERE doc_id = ?", (doc_id,))
            row = cursor.fetchone()
            if not row:
                return None
            doc = dict(row)
            doc["tags"] = json.loads(doc.get("tags") or "[]")
            doc["custom_attributes"] = json.loads(doc.get("custom_attributes") or "{}")
            return doc

    def list_documents(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT doc_id, title, source_type, file_name, service_name, created_at FROM documents ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_chunks_for_doc(self, doc_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM document_chunks WHERE doc_id = ? ORDER BY chunk_index ASC", (doc_id,))
            rows = cursor.fetchall()
            result = []
            for r in rows:
                c = dict(r)
                c["metadata"] = json.loads(c.get("metadata_json") or "{}")
                result.append(c)
            return result

    def get_all_chunks(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM document_chunks")
            rows = cursor.fetchall()
            result = []
            for r in rows:
                c = dict(r)
                c["metadata"] = json.loads(c.get("metadata_json") or "{}")
                result.append(c)
            return result

    def delete_document(self, doc_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM document_chunks WHERE doc_id = ?", (doc_id,))
            cursor.execute("DELETE FROM documents WHERE doc_id = ?", (doc_id,))
            conn.commit()
            return cursor.rowcount > 0


# Singleton metadata DB
metadata_db = MetadataDatabase()
