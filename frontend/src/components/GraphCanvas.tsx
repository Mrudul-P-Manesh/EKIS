"use client";

import { useEffect, useRef, useState } from "react";
import { GraphNode, GraphEdge, GraphSubgraph } from "@/lib/types";

interface GraphCanvasProps {
  graph: GraphSubgraph;
  selectedNode?: GraphNode | null;
  onSelectNode?: (node: GraphNode | null) => void;
  filterType?: string | null;
}

export function GraphCanvas({ graph, selectedNode, onSelectNode, filterType }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number; vx?: number; vy?: number }>>({});
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Animated pulse progress along edges
  const animFrameRef = useRef<number>();
  const pulseRef = useRef<number>(0);

  const entityColors: Record<string, { fill: string; stroke: string; text: string }> = {
    Service: { fill: "#18181b", stroke: "#3b82f6", text: "#93c5fd" },
    ADR: { fill: "#18181b", stroke: "#8b5cf6", text: "#c4b5fd" },
    Incident: { fill: "#18181b", stroke: "#ef4444", text: "#fca5a5" },
    ErrorCode: { fill: "#18181b", stroke: "#f97316", text: "#fdba74" },
    Config: { fill: "#18181b", stroke: "#10b981", text: "#6ee7b7" },
    Database: { fill: "#18181b", stroke: "#06b6d4", text: "#67e8f9" },
    default: { fill: "#18181b", stroke: "#71717a", text: "#d4d4d8" },
  };

  // Filter nodes according to selected entity type
  const filteredNodes = filterType
    ? graph.nodes.filter((n) => (n.entity_type || "default").toLowerCase() === filterType.toLowerCase())
    : graph.nodes;

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = graph.edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // Initialize node layout positions
  useEffect(() => {
    if (!filteredNodes || filteredNodes.length === 0) return;

    const width = 800;
    const height = 580;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 75;

    const newPos: Record<string, { x: number; y: number }> = {};
    filteredNodes.forEach((node, i) => {
      const angle = (i / filteredNodes.length) * 2 * Math.PI;
      newPos[node.id] = {
        x: centerX + radius * Math.cos(angle) + (Math.random() * 20 - 10),
        y: centerY + radius * Math.sin(angle) + (Math.random() * 20 - 10),
      };
    });

    setPositions(newPos);
  }, [graph, filterType]);

  // Continuous animation loop with particle edge pulses
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      pulseRef.current = (pulseRef.current + 0.008) % 1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Edges
      filteredEdges.forEach((edge) => {
        const srcPos = positions[edge.source];
        const tgtPos = positions[edge.target];
        if (!srcPos || !tgtPos) return;

        const isConnectedToSelected =
          selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

        ctx.beginPath();
        ctx.moveTo(srcPos.x, srcPos.y);
        ctx.lineTo(tgtPos.x, tgtPos.y);
        ctx.strokeStyle = isConnectedToSelected ? "rgba(244, 244, 245, 0.8)" : "rgba(63, 63, 70, 0.4)";
        ctx.lineWidth = isConnectedToSelected ? 2 : 1;
        ctx.stroke();

        // Animated packet particle traveling along edge
        const particleT = (pulseRef.current + (edge.source.charCodeAt(0) % 5) * 0.2) % 1;
        const px = srcPos.x + (tgtPos.x - srcPos.x) * particleT;
        const py = srcPos.y + (tgtPos.y - srcPos.y) * particleT;

        ctx.beginPath();
        ctx.arc(px, py, isConnectedToSelected ? 3 : 2, 0, 2 * Math.PI);
        ctx.fillStyle = isConnectedToSelected ? "#60a5fa" : "rgba(161, 161, 170, 0.6)";
        ctx.fill();

        // Edge relationship label
        if (isConnectedToSelected && edge.relation) {
          const midX = (srcPos.x + tgtPos.x) / 2;
          const midY = (srcPos.y + tgtPos.y) / 2;
          ctx.font = "9px monospace";
          ctx.fillStyle = "#e4e4e7";
          ctx.textAlign = "center";
          ctx.fillText(edge.relation, midX, midY - 4);
        }
      });

      // 2. Draw Nodes
      filteredNodes.forEach((node) => {
        const pos = positions[node.id];
        if (!pos) return;

        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode === node.id;
        const typeKey = node.entity_type || "default";
        const theme = entityColors[typeKey] || entityColors.default;

        // Glow ring if selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 22, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, isSelected ? 18 : 14, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? "#27272a" : theme.fill;
        ctx.fill();
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.strokeStyle = isSelected ? "#ffffff" : isHovered ? "#e4e4e7" : theme.stroke;
        ctx.stroke();

        // Node label
        const nodeLabel = node.label || node.id;
        ctx.font = isSelected ? "bold 11px sans-serif" : "10px sans-serif";
        ctx.fillStyle = isSelected ? "#ffffff" : theme.text;
        ctx.textAlign = "center";
        ctx.fillText(nodeLabel, pos.x, pos.y + 26);
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [positions, filteredNodes, filteredEdges, selectedNode, hoveredNode]);

  // Drag & selection interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left) * (800 / rect.width);
    const mouseY = (e.clientY - rect.top) * (580 / rect.height);

    for (const node of filteredNodes) {
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
      for (const node of filteredNodes) {
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
