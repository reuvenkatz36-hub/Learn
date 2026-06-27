'use client'
import { useState, useEffect, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { KnowledgeNode, KnowledgeEdge } from '@/types/database'
import { Loader2 } from 'lucide-react'
import Mascot from '@/components/crew/Mascot'
import { CREW } from '@/lib/crew'

const elephant = CREW.elephant

interface Props {
  roadmaps: { id: string; title: string }[]
}

function masteryColor(level: number) {
  if (level >= 80) return '#22B07D'
  if (level >= 50) return '#F5A524'
  if (level >= 20) return '#3BA9E0'
  return '#C9C5BD'
}

function toFlowNodes(nodes: KnowledgeNode[]): Node[] {
  return nodes.map(n => {
    const pos = (n.position as { x: number; y: number }) ?? { x: 0, y: 0 }
    return {
      id: n.id,
      position: { x: pos.x, y: pos.y },
      data: { label: n.label, mastery: n.mastery_level, type: n.node_type },
      style: {
        background: '#FFFFFF',
        border: `2px solid ${masteryColor(n.mastery_level)}`,
        borderRadius: n.node_type === 'topic' ? '12px' : n.node_type === 'concept' ? '8px' : '6px',
        color: '#1C1B1A',
        fontSize: n.node_type === 'topic' ? '14px' : n.node_type === 'concept' ? '12px' : '11px',
        fontWeight: n.node_type === 'topic' ? 700 : n.node_type === 'concept' ? 600 : 400,
        padding: n.node_type === 'topic' ? '10px 16px' : '6px 12px',
        minWidth: n.node_type === 'topic' ? 120 : 80,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      },
    }
  })
}

function toFlowEdges(edges: KnowledgeEdge[]): Edge[] {
  return edges.map(e => ({
    id: e.id,
    source: e.source_id,
    target: e.target_id,
    style: { stroke: '#D6D3CC', strokeWidth: 1.5 },
    animated: false,
  }))
}

export default function KnowledgeGraphClient({ roadmaps }: Props) {
  const [selectedRoadmap, setSelectedRoadmap] = useState(roadmaps[0]?.id ?? '')
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(false)

  const fetchGraph = useCallback(async (roadmapId: string) => {
    if (!roadmapId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/knowledge-graph?roadmapId=${roadmapId}`)
      const data = await res.json()
      setNodes(toFlowNodes(data.nodes ?? []))
      setEdges(toFlowEdges(data.edges ?? []))
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  useEffect(() => {
    if (selectedRoadmap) fetchGraph(selectedRoadmap)
  }, [selectedRoadmap, fetchGraph])

  const onNodeDragStop = useCallback(async (_: unknown, node: Node) => {
    await fetch('/api/knowledge-graph', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodeId: node.id, position: node.position }),
    })
  }, [])

  if (roadmaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-paper">
        <Mascot who="elephant" size={80} className="mb-4" />
        <h2 className="font-bold text-ink text-lg mb-2">No knowledge graphs yet</h2>
        <p className="text-ink-soft text-sm">Create a learning roadmap and {elephant.name} will map it out</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-paper">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-line flex-shrink-0 bg-surface">
        <div className="flex items-center gap-3">
          <Mascot who="elephant" size={40} halo />
          <div>
            <h1 className="font-bold text-ink leading-tight">Knowledge Graph</h1>
            <p className="text-xs text-ink-soft">{elephant.name} keeps track of how it connects</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-ink-soft">
            {[
              { color: '#C9C5BD', label: 'Not started' },
              { color: '#3BA9E0', label: 'Learning' },
              { color: '#F5A524', label: 'Progressing' },
              { color: '#22B07D', label: 'Mastered' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
          <select
            value={selectedRoadmap}
            onChange={e => setSelectedRoadmap(e.target.value)}
            className="bg-paper border border-line rounded-lg px-3 py-1.5 text-sm text-ink-soft focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as string]: elephant.accent }}
          >
            {roadmaps.map(r => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-3 text-ink-soft">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: elephant.accent }} />
              Loading graph...
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#E6E3DC" gap={20} />
            <Controls className="!bg-white !border-line !shadow-sm" />
            <MiniMap
              nodeColor={n => masteryColor((n.data?.mastery as number) ?? 0)}
              className="!bg-white !border-line"
            />
          </ReactFlow>
        )}

        {!loading && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Mascot who="elephant" size={64} className="mx-auto mb-3" />
              <p className="text-ink-soft text-sm">No nodes found for this roadmap</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
