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
import { GitBranch, Loader2 } from 'lucide-react'

interface Props {
  roadmaps: { id: string; title: string }[]
}

function masteryColor(level: number) {
  if (level >= 80) return '#10b981'
  if (level >= 50) return '#f59e0b'
  if (level >= 20) return '#8b5cf6'
  return '#374151'
}

function toFlowNodes(nodes: KnowledgeNode[]): Node[] {
  return nodes.map(n => {
    const pos = (n.position as { x: number; y: number }) ?? { x: 0, y: 0 }
    return {
      id: n.id,
      position: { x: pos.x, y: pos.y },
      data: { label: n.label, mastery: n.mastery_level, type: n.node_type },
      style: {
        background: '#111827',
        border: `2px solid ${masteryColor(n.mastery_level)}`,
        borderRadius: n.node_type === 'topic' ? '12px' : n.node_type === 'concept' ? '8px' : '6px',
        color: '#f9fafb',
        fontSize: n.node_type === 'topic' ? '14px' : n.node_type === 'concept' ? '12px' : '11px',
        fontWeight: n.node_type === 'topic' ? 700 : n.node_type === 'concept' ? 600 : 400,
        padding: n.node_type === 'topic' ? '10px 16px' : '6px 12px',
        minWidth: n.node_type === 'topic' ? 120 : 80,
      },
    }
  })
}

function toFlowEdges(edges: KnowledgeEdge[]): Edge[] {
  return edges.map(e => ({
    id: e.id,
    source: e.source_id,
    target: e.target_id,
    style: { stroke: '#374151', strokeWidth: 1.5 },
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
      <div className="flex flex-col items-center justify-center h-full text-center py-20">
        <GitBranch className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h2 className="font-semibold text-lg mb-2">No knowledge graphs yet</h2>
        <p className="text-gray-500 text-sm">Create a learning roadmap to auto-generate your knowledge graph</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
        <div>
          <h1 className="font-semibold">Knowledge Graph</h1>
          <p className="text-xs text-gray-500">Visualize your learning concepts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {[
              { color: '#374151', label: 'Not started' },
              { color: '#8b5cf6', label: 'Learning' },
              { color: '#f59e0b', label: 'Progressing' },
              { color: '#10b981', label: 'Mastered' },
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
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-violet-500"
          >
            {roadmaps.map(r => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
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
            <Background color="#1f2937" gap={20} />
            <Controls className="!bg-gray-900 !border-white/10" />
            <MiniMap
              nodeColor={n => masteryColor((n.data?.mastery as number) ?? 0)}
              className="!bg-gray-900 !border-white/10"
            />
          </ReactFlow>
        )}

        {!loading && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <GitBranch className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No nodes found for this roadmap</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
