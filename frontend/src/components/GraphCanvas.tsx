"use client";

import { useEffect, useRef, useState } from "react";
import { GraphNode, GraphEdge, GraphSubgraph } from "@/lib/types";

interface GraphCanvasProps {
  graph: GraphSubgraph;
  onSelectNode?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
}

export function GraphCanvas({ graph, onSelectNode, selectedNodeId }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Color mapping by entity type
  const entityColors: Record<string, { fill: string; stroke: string; text: string }> = {
    Service: { fill: "#1e3a8a", stroke: "#3b82f6", text: "#93c5fd" },
    ADR: { fill: "#312e81", stroke: "#6366f1", text: "#c7d2fe" },
    Incident: { fill: "#7f1d1d", stroke: "#ef4444", text: "#fca5a5" },
    ErrorCode: { fill: "#7c2d12", stroke: "#f97316", text: "#fdba74" },
    Config: { fill: "#064e3b", stroke: "#10b981", text: "#6ee7b7" },
    Database: { fill: "#365314", stroke: "#84cc16", text: "#bef264" },
    default: { fill: "#334155", stroke: "#64748b", text: "#cbd5e1" },
  };

  // Initialize circular or force layout coordinates
  useEffect(() => {
    if (!graph.nodes || graph.nodes.length === 0) return;

    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 80;

    const newPos: Record<string, { x: number; y: number }> = {};
    graph.nodes.forEach((node, i) => {
      const angle = (i / graph.nodes.length) * 2 * Math.PI;
      newPos[node.id] = {
        x: centerX + radius * Math.cos(angle) + (Math.random() * 40 - 20),
        y: centerY + radius * Math.sin(angle) + (Math.random() * 40 - 20),
      };
    });

    setPositions(newPos);
  }, [graph]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Edges
    graph.edges.forEach((edge) => {
      const srcPos = positions[edge.source];
      const tgtPos = positions[edge.target];
      if (!srcPos || !tgtPos) return;

      ctx.beginPath();
      ctx.moveTo(srcPos.x, srcPos.y);
      ctx.lineTo(tgtPos.x, tgtPos.y);
      ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Relation label on edge midpoint
      const midX = (srcPos.x + tgtPos.x) / 2;
      const midY = (srcPos.y + tgtPos.y) / 2;
      ctx.font = "9px sans-serif";
      ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
      ctx.textAlign = "center";
      ctx.fillText(edge.relation, midX, midY - 4);
    });

    // 2. Draw Nodes
    graph.nodes.forEach((node) => {
      const pos = positions[node.id];
      if (!pos) return;

      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNode === node.id;
      const colors = entityColors[node.entity_type] || entityColors.default;

      // Glow if selected or hovered
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 24, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.15)";
        ctx.fill();
      }

      // Main Circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 18 : 15, 0, 2 * Math.PI);
      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#60a5fa" : colors.stroke;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Node Label
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = colors.text;
      ctx.textAlign = "center";
      ctx.fillText(node.label, pos.x, pos.y + (isSelected ? 30 : 26));

      // Node Type sub-label
      ctx.font = "9px sans-serif";
      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.fillText(node.entity_type, pos.x, pos.y + (isSelected ? 42 : 38));
    });
  }, [graph, positions, selectedNodeId, hoveredNode]);

  // Handle canvas mouse clicks for node selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let clicked: GraphNode | null = null;
    for (const node of graph.nodes) {
      const pos = positions[node.id];
      if (pos) {
        const dist = Math.hypot(pos.x - clickX, pos.y - clickY);
        if (dist <= 20) {
          clicked = node;
          break;
        }
      }
    }

    if (onSelectNode) {
      onSelectNode(clicked);
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-2xl bg-[#090d16] border border-slate-800 overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onClick={handleCanvasClick}
        className="cursor-pointer max-w-full"
      />
      <div className="absolute top-4 right-4 flex flex-wrap gap-2 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 backdrop-blur-md">
        {Object.entries(entityColors).map(([type, c]) => {
          if (type === "default") return null;
          return (
            <span key={type} className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-800/80">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.stroke }} />
              <span className="text-slate-300">{type}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
