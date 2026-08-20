import re
from typing import List, Dict, Any, Tuple, Optional
from backend.app.models.schemas import GraphNode, GraphEdge, GraphSubgraph, EntityType, RelationType
from backend.app.core.logging import logger


class EngineeringEntityExtractor:
    """Extracts domain entities (Services, ADRs, Incidents, ErrorCodes, Endpoints, Configs) and relationships."""

    # Common engineering entity patterns
    SERVICE_PATTERN = re.compile(r"\b([a-zA-Z0-9_-]+(?:service|gateway|proxy|worker|daemon|engine|db|broker))\b", re.IGNORECASE)
    ADR_PATTERN = re.compile(r"\b(ADR[-_ ]\d+|ADR\d+)\b", re.IGNORECASE)
    ERROR_CODE_PATTERN = re.compile(r"\b(HTTP\s*(?:401|403|404|500|502|503|504)|401\s+Unauthorized|403\s+Forbidden|ERR_[A-Z0-9_]+|[A-Z0-9_]+_ERROR)\b", re.IGNORECASE)
    CONFIG_PATTERN = re.compile(r"\b([A-Z][A-Z0-9_]*(?:SECRET|KEY|URL|TOKEN|PORT|HOST|TIMEOUT|TTL|ENV|CONFIG|INTERVAL|PATH))\b")
    ENDPOINT_PATTERN = re.compile(r"(?:GET|POST|PUT|DELETE|PATCH)\s+([/a-zA-Z0-9_{}-]+)|([/][a-zA-Z0-9_/-]{3,})")
    INCIDENT_PATTERN = re.compile(r"\b(INC[-_ ]\d+|INCIDENT[-_ ]\d+|Postmortem[-_ ][a-zA-Z0-9_-]+)\b", re.IGNORECASE)
    DATABASE_PATTERN = re.compile(r"\b(PostgreSQL|Postgres|Redis|Neo4j|Qdrant|MongoDB|MySQL|DynamoDB|Elasticsearch)\b", re.IGNORECASE)

    def extract_from_text(self, text: str, doc_id: str, chunk_id: Optional[str] = None) -> GraphSubgraph:
        nodes_dict: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = []

        # 1. Extract Services
        for match in self.SERVICE_PATTERN.finditer(text):
            srv_name = match.group(1).lower()
            node_id = f"service_{srv_name}"
            if node_id not in nodes_dict:
                nodes_dict[node_id] = GraphNode(
                    id=node_id,
                    label=srv_name,
                    entity_type=EntityType.SERVICE,
                    properties={"name": srv_name},
                    doc_id=doc_id,
                    chunk_id=chunk_id
                )

        # 2. Extract ADRs
        for match in self.ADR_PATTERN.finditer(text):
            adr_code = match.group(1).upper().replace(" ", "-").replace("_", "-")
            node_id = f"adr_{adr_code}"
            if node_id not in nodes_dict:
                nodes_dict[node_id] = GraphNode(
                    id=node_id,
                    label=adr_code,
                    entity_type=EntityType.ADR,
                    properties={"code": adr_code},
                    doc_id=doc_id,
                    chunk_id=chunk_id
                )

        # 3. Extract Error Codes
        for match in self.ERROR_CODE_PATTERN.finditer(text):
            raw_err = match.group(1).strip()
            err_code = "401-Unauthorized" if "401" in raw_err else raw_err
            node_id = f"error_{err_code.lower().replace(' ', '_')}"
            if node_id not in nodes_dict:
                nodes_dict[node_id] = GraphNode(
                    id=node_id,
                    label=err_code,
                    entity_type=EntityType.ERROR_CODE,
                    properties={"code": err_code},
                    doc_id=doc_id,
                    chunk_id=chunk_id
                )

        # 4. Extract Config Keys
        for match in self.CONFIG_PATTERN.finditer(text):
            cfg_name = match.group(1)
            node_id = f"config_{cfg_name.lower()}"
            if node_id not in nodes_dict:
                nodes_dict[node_id] = GraphNode(
                    id=node_id,
                    label=cfg_name,
                    entity_type=EntityType.CONFIG,
                    properties={"key": cfg_name},
                    doc_id=doc_id,
                    chunk_id=chunk_id
                )

        # 5. Extract Databases
        for match in self.DATABASE_PATTERN.finditer(text):
            db_name = match.group(1).capitalize()
            node_id = f"database_{db_name.lower()}"
            if node_id not in nodes_dict:
                nodes_dict[node_id] = GraphNode(
                    id=node_id,
                    label=db_name,
                    entity_type=EntityType.DATABASE,
                    properties={"name": db_name},
                    doc_id=doc_id,
                    chunk_id=chunk_id
                )

        # 6. Extract Incidents
        for match in self.INCIDENT_PATTERN.finditer(text):
            inc_name = match.group(1)
            node_id = f"incident_{inc_name.lower()}"
            if node_id not in nodes_dict:
                nodes_dict[node_id] = GraphNode(
                    id=node_id,
                    label=inc_name,
                    entity_type=EntityType.INCIDENT,
                    properties={"incident_id": inc_name},
                    doc_id=doc_id,
                    chunk_id=chunk_id
                )

        # Derive relations between co-occurring entities within the same chunk/text
        node_list = list(nodes_dict.values())
        for i in range(len(node_list)):
            for j in range(i + 1, len(node_list)):
                src = node_list[i]
                tgt = node_list[j]
                
                # Rule-based relationship inference
                relation = self._infer_relation(src, tgt, text)
                if relation:
                    edges.append(GraphEdge(
                        source=src.id,
                        target=tgt.id,
                        relation=relation,
                        properties={"context": text[:120]},
                        weight=1.0
                    ))

        return GraphSubgraph(nodes=list(nodes_dict.values()), edges=edges)

    def _infer_relation(self, src: GraphNode, tgt: GraphNode, text: str) -> Optional[str]:
        src_type, tgt_type = src.entity_type, tgt.entity_type
        
        if src_type == EntityType.SERVICE and tgt_type == EntityType.SERVICE:
            if "call" in text.lower() or "request" in text.lower() or "forward" in text.lower():
                return RelationType.CALLS
            return RelationType.DEPENDS_ON

        if src_type == EntityType.SERVICE and tgt_type == EntityType.CONFIG:
            return RelationType.CONFIGURED_BY
        if tgt_type == EntityType.SERVICE and src_type == EntityType.CONFIG:
            return RelationType.CONFIGURED_BY

        if src_type == EntityType.SERVICE and tgt_type == EntityType.DATABASE:
            return RelationType.DEPENDS_ON

        if (src_type == EntityType.INCIDENT or src_type == EntityType.SERVICE) and tgt_type == EntityType.ERROR_CODE:
            return RelationType.CAUSES

        if src_type == EntityType.ADR and (tgt_type == EntityType.SERVICE or tgt_type == EntityType.CONFIG):
            return RelationType.DEFINES

        if src_type == EntityType.INCIDENT and tgt_type == EntityType.ADR:
            return RelationType.RESOLVED_BY

        return RelationType.DOCUMENTS
