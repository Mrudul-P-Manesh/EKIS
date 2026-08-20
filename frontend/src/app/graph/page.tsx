"use client";

import { useState, useEffect } from "react";
import { fetchKnowledgeGraph } from "@/lib/api";
import { GraphSubgraph, GraphNode } from "@/lib/types";
import { GraphCanvas } from "@/components/GraphCanvas";
import { Network, Layers, RefreshCw, Info, Tag, ArrowRight } from "lucide-react";

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

  // Find connected edges and neighbors for selected node
  const connectedEdges = selectedNode
    ? graph.edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Network className="h-4 w-4" />
            <span>Relational Knowledge Topology</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Engineering Knowledge Graph Explorer
          </h1>
          <p className="text-sm text-slate-400">
            Interactive multi-relational graph linking Microservices, Architecture Decisions (ADRs), Runbooks, Incidents, Error Codes, and Configurations.
          </p>
        </div>

        <button
          onClick={loadGraph}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center space-x-2 shrink-0 border border-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Graph</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Total Entities</span>
          <span className="text-2xl font-bold text-white">{graph.nodes.length}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Relational Edges</span>
          <span className="text-2xl font-bold text-indigo-400">{graph.edges.length}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Services & Components</span>
          <span className="text-2xl font-bold text-blue-400">
            {graph.nodes.filter((n) => n.entity_type === "Service").length}
          </span>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block">Incidents & ADRs</span>
          <span className="text-2xl font-bold text-emerald-400">
            {graph.nodes.filter((n) => n.entity_type === "ADR" || n.entity_type === "Incident").length}
          </span>
        </div>
      </div>

      {/* Main Canvas & Inspection Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualizer Canvas */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Click any node in the canvas to inspect dependencies and relations:</span>
          </div>
          <GraphCanvas
            graph={graph}
            selectedNodeId={selectedNode?.id}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {/* Node Inspector Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Info className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Entity Inspector
            </h3>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Entity Label</span>
                <span className="text-lg font-bold text-white">{selectedNode.label}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Type</span>
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                  {selectedNode.entity_type}
                </span>
              </div>

              {/* Connected Relations */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-300 block uppercase tracking-wider">
                  Connected Relationships ({connectedEdges.length})
                </span>
                {connectedEdges.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {connectedEdges.map((e, idx) => {
                      const isSource = e.source === selectedNode.id;
                      const otherId = isSource ? e.target : e.source;
                      const otherNode = graph.nodes.find((n) => n.id === otherId);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1"
                        >
                          <div className="flex items-center space-x-1.5 text-indigo-400 font-mono font-semibold">
                            <span>{isSource ? "--" : "<-"}</span>
                            <span>[{e.relation}]</span>
                            <ArrowRight className="h-3 w-3 text-slate-500" />
                          </div>
                          <span className="text-white font-medium block">
                            {otherNode?.label || otherId} ({otherNode?.entity_type || "Entity"})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No connected edges found.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
              <Network className="h-8 w-8 text-slate-600 animate-pulse" />
              <p className="text-xs">
                Select an entity in the graph to inspect properties, incident links, and service topology.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
