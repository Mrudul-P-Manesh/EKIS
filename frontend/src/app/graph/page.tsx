"use client";

import { useState, useEffect } from "react";
import { fetchKnowledgeGraph } from "@/lib/api";
import { GraphSubgraph, GraphNode } from "@/lib/types";
import { GraphCanvas } from "@/components/GraphCanvas";
import { Network, RefreshCw, ArrowRight } from "lucide-react";

export default function KnowledgeGraphPage() {
  const [graph, setGraph] = useState<GraphSubgraph>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const data = await fetchKnowledgeGraph();
      setGraph(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const connectedEdges = selectedNode
    ? graph.edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
            Knowledge Graph Explorer
          </h1>
          <p className="text-xs text-zinc-400">
            Multi-relational topology connecting Microservices, ADRs, Incidents, and Configurations.
          </p>
        </div>

        <button
          onClick={loadGraph}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 font-medium transition self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center space-x-4 text-xs font-mono text-zinc-400 px-1">
        <span>Nodes: <strong className="text-zinc-100">{graph.nodes.length}</strong></span>
        <span>Relationships: <strong className="text-zinc-100">{graph.edges.length}</strong></span>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-3 h-[580px] bg-[#111113] border border-zinc-800 rounded-xl overflow-hidden shadow-lg relative">
          {loading ? (
            <div className="flex h-full items-center justify-center space-x-2 text-zinc-500 text-xs">
              <span className="animate-spin h-4 w-4 border-2 border-zinc-500 border-t-transparent rounded-full" />
              <span>Rendering graph topology...</span>
            </div>
          ) : (
            <GraphCanvas
              graph={graph}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          )}
        </div>

        {/* Node Inspector Sidebar */}
        <div className="bg-[#111113] border border-zinc-800 rounded-xl p-5 space-y-4 h-[580px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Entity Inspector
            </h2>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-mono">
                  {selectedNode.entity_type}
                </span>
                <h3 className="text-sm font-semibold text-zinc-100 pt-1">
                  {selectedNode.label || selectedNode.id}
                </h3>
              </div>

              {/* Connected Relationships */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Relationships ({connectedEdges.length})
                </h4>
                <div className="space-y-1.5">
                  {connectedEdges.map((edge, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-zinc-950 border border-zinc-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center space-x-1.5 text-zinc-400 font-mono text-[11px]">
                        <span className="truncate">{edge.source}</span>
                        <ArrowRight className="h-3 w-3 text-zinc-600 flex-shrink-0" />
                        <span className="truncate">{edge.target}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase font-mono">
                        {edge.relation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500 text-xs space-y-2">
              <Network className="h-6 w-6 text-zinc-600" />
              <p>Click on any node in the canvas to inspect entity properties and relationships.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
