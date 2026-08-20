from typing import List, Dict, Any, Optional, Set
from collections import defaultdict, deque
from backend.app.config import settings
from backend.app.models.schemas import (
    GraphNode, GraphEdge, GraphSubgraph, GraphSearchResult, EntityType, RelationType
)
from backend.app.core.logging import logger

try:
    from neo4j import GraphDatabase
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False


class KnowledgeGraphRetriever:
    """Graph retrieval leveraging Neo4j with in-memory graph engine fallback."""

    def __init__(self):
        self.driver = None
        self._in_memory_nodes: Dict[str, GraphNode] = {}
        self._in_memory_edges: List[GraphEdge] = []
        self._adj_list: Dict[str, List[Tuple[str, GraphEdge]]] = defaultdict(list)
        self._init_neo4j()

    def _init_neo4j(self):
        if NEO4J_AVAILABLE and not settings.USE_IN_MEMORY_GRAPH:
            try:
                self.driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
                )
                self.driver.verify_connectivity()
                logger.info(f"Connected to Neo4j at {settings.NEO4J_URI}")
            except Exception as e:
                logger.warning(f"Neo4j connection failed: {e}. Using in-memory graph engine.")
                self.driver = None
        else:
            logger.info("Using in-memory Knowledge Graph engine.")

    def add_subgraph(self, subgraph: GraphSubgraph):
        """Add nodes and edges to knowledge graph."""
        for node in subgraph.nodes:
            self._in_memory_nodes[node.id] = node

        for edge in subgraph.edges:
            self._in_memory_edges.append(edge)
            self._adj_list[edge.source].append((edge.target, edge))
            self._adj_list[edge.target].append((edge.source, edge))

        if self.driver:
            try:
                with self.driver.session() as session:
                    for node in subgraph.nodes:
                        session.run(
                            """
                            MERGE (n:Entity {id: $id})
                            SET n.label = $label,
                                n.entity_type = $entity_type,
                                n.doc_id = $doc_id,
                                n.chunk_id = $chunk_id
                            """,
                            id=node.id,
                            label=node.label,
                            entity_type=node.entity_type,
                            doc_id=node.doc_id,
                            chunk_id=node.chunk_id
                        )
                    for edge in subgraph.edges:
                        session.run(
                            """
                            MATCH (a:Entity {id: $source}), (b:Entity {id: $target})
                            MERGE (a)-[r:RELATION {relation: $relation}]->(b)
                            SET r.weight = $weight
                            """,
                            source=edge.source,
                            target=edge.target,
                            relation=edge.relation,
                            weight=edge.weight
                        )
            except Exception as e:
                logger.warning(f"Failed to push subgraph to Neo4j: {e}")

    def search_entities(self, query: str, top_k: int = 5) -> List[GraphSearchResult]:
        """Find relevant entities and their relational neighborhoods."""
        query_lower = query.lower()
        matched_nodes = []

        # Find direct entity matches in query
        for node_id, node in self._in_memory_nodes.items():
            score = 0.0
            node_label_lower = node.label.lower()

            if node_label_lower in query_lower:
                score += 2.0
            elif any(token in query_lower for token in node_label_lower.split()):
                score += 1.0

            # Match properties (e.g. error codes, service names)
            for k, v in node.properties.items():
                if str(v).lower() in query_lower:
                    score += 1.5

            if score > 0:
                matched_nodes.append((score, node))

        matched_nodes.sort(key=lambda x: x[0], reverse=True)
        top_matches = matched_nodes[:top_k]

        results = []
        for rank, (score, seed_node) in enumerate(top_matches, 1):
            # Traverse 1-hop and 2-hop neighborhood
            neighbors = self._get_neighborhood(seed_node.id, max_hops=2)
            
            # Format relationship path description
            paths_desc = []
            for n_id, edge in neighbors:
                other_node = self._in_memory_nodes.get(n_id)
                if other_node:
                    paths_desc.append(f"{seed_node.label} --[{edge.relation}]--> {other_node.label} ({other_node.entity_type})")

            path_summary = "; ".join(paths_desc[:4]) if paths_desc else f"Entity: {seed_node.label}"

            results.append(GraphSearchResult(
                chunk_id=seed_node.chunk_id,
                doc_id=seed_node.doc_id,
                entity_id=seed_node.id,
                entity_label=seed_node.label,
                entity_type=seed_node.entity_type,
                related_entities=[
                    {
                        "id": n_id,
                        "label": self._in_memory_nodes[n_id].label if n_id in self._in_memory_nodes else n_id,
                        "relation": edge.relation
                    }
                    for n_id, edge in neighbors[:6]
                ],
                relationship_path=path_summary,
                relevance_score=score,
                rank=rank
            ))

        return results

    def _get_neighborhood(self, seed_id: str, max_hops: int = 2) -> List[tuple]:
        visited: Set[str] = {seed_id}
        queue = deque([(seed_id, 0)])
        neighbors = []

        while queue:
            curr_id, hops = queue.popleft()
            if hops >= max_hops:
                continue

            for next_id, edge in self._adj_list.get(curr_id, []):
                if next_id not in visited:
                    visited.add(next_id)
                    neighbors.append((next_id, edge))
                    queue.append((next_id, hops + 1))

        return neighbors

    def get_full_graph(self) -> GraphSubgraph:
        """Return the complete in-memory knowledge graph."""
        return GraphSubgraph(
            nodes=list(self._in_memory_nodes.values()),
            edges=self._in_memory_edges
        )

    def clear(self):
        self._in_memory_nodes.clear()
        self._in_memory_edges.clear()
        self._adj_list.clear()


graph_retriever = KnowledgeGraphRetriever()
