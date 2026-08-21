"use client";

import { useEffect, useRef, useState } from "react";
import { GraphNode, GraphEdge, GraphSubgraph } from "@/lib/types";

interface GraphCanvasProps {
  graph: GraphSubgraph;
  selectedNode?: GraphNode | null;
  onSelectNode?: (node: GraphNode | null) => void;
}

export function GraphCanvas({ graph, selectedNode, onSelectNode }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Minimal refined color mapping by entity type
  const entityColors: Record<string, { fill: string; stroke: string; text: string }> = {
    Service: { fill: "#18181b", stroke: "#3b82f6", text: "#93c5fd" },
    ADR: { fill: "#18181b", stroke: "#8b5cf6", text: "#c4b5fd" },
    Incident: { fill: "#18181b", stroke: "#ef4444", text: "#fca5a5" },
    ErrorCode: { fill: "#18181b", stroke: "#f97316", text: "#fdba74" },
    Config: { fill: "#18181b", stroke: "#10b981", text: "#6ee7b7" },
    Database: { fill: "#18181b", stroke: "#06b6d4", text: "#67e8f9" },
    default: { fill: "#18181b", stroke: "#71717a", text: "#d4d4d8" },
  };

  // Initialize circular coordinates
  useEffect(() => {
    if (!graph.nodes || graph.nodes.length === 0) return;

    const width = 800;
    const height = 580;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 70;

    const newPos: Record<string, { x: number; y: number }> = {};
    graph.nodes.forEach((node, i) => {
      const angle = (i / graph.nodes.length) * 2 * Math.PI;
      newPos[node.id] = {
        x: centerX + radius * Math.cos(angle) + (Math.random() * 20 - 10),
        y: centerY + radius * Math.sin(angle) + (Math.random() * 20 - 10),
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

      const isConnectedToSelected =
        selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

      ctx.beginPath();
      ctx.moveTo(srcPos.x, srcPos.y);
      ctx.lineTo(tgtPos.x, tgtPos.y);
      ctx.strokeStyle = isConnectedToSelected ? "rgba(244, 244, 245, 0.7)" : "rgba(63, 63, 70, 0.35)";
      ctx.lineWidth = isConnectedToSelected ? 2 : 1;
      ctx.stroke();

      // Draw subtle edge label
      if (isConnectedToSelected && edge.relation) {
        const midX = (srcPos.x + tgtPos.x) / 2;
        const midY = (srcPos.y + tgtPos.y) / 2;
        ctx.font = "9px monospace";
        ctx.fillStyle = "#a1a1aa";
        ctx.textAlign = "center";
        ctx.fillText(edge.relation, midX, midY - 3);
      }
    });

    // 2. Draw Nodes
    graph.nodes.forEach((node) => {
      const pos = positions[node.id];
      if (!pos) return;

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode === node.id;
      const typeKey = node.entity_type || "default";
      const theme = entityColors[typeKey] || entityColors.default;

      // Circle node
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 18 : 14, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#27272a" : theme.fill;
      ctx.fill();
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeStyle = isSelected ? "#ffffff" : isHovered ? "#e4e4e7" : theme.stroke;
      ctx.stroke();

      // Label text
      const nodeLabel = node.label || node.id;
      ctx.font = isSelected ? "bold 11px sans-serif" : "10px sans-serif";
      ctx.fillStyle = isSelected ? "#ffffff" : theme.text;
      ctx.textAlign = "center";
      ctx.fillText(nodeLabel, pos.x, pos.y + 26);
    });
  }, [positions, graph, selectedNode, hoveredNode]);

  // Mouse handlers for dragging and selection
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left) * (800 / rect.width);
    const mouseY = (e.clientY - rect.top) * (580 / rect.height);

    for (const node of graph.nodes) {
      const pos = positions[node.id];
      if (pos) {
        const dist = Math.hypot(pos.x - mouseX, pos.y - mouseY);
        if (dist <= 20) {
          setDraggingNode(node.id);
          onSelectNode?.(node);
          return;
        }
      }
    }
    onSelectNode?.(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left) * (800 / rect.width);
    const mouseY = (e.clientY - rect.top) * (580 / rect.height);

    if (draggingNode) {
      setPositions((prev) => ({
        ...prev,
        [draggingNode]: { x: mouseX, y: mouseY },
      }));
    } else {
      let foundHover: string | null = null;
      for (const node of graph.nodes) {
        const pos = positions[node.id];
        if (pos && Math.hypot(pos.x - mouseX, pos.y - mouseY) <= 20) {
          foundHover = node.id;
          break;
        }
      }
      setHoveredNode(foundHover);
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={580}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="w-full h-full cursor-grab active:cursor-grabbing"
    />
  );
}
