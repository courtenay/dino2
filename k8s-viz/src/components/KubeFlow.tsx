'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from './nodes';
import { DetailsPanel } from './DetailsPanel';
import { NamespaceFilter } from './NamespaceFilter';
import { buildGraph, type K8sNodeData, type ViewMode } from '@/lib/graph-builder';
import type { ClusterData } from '@/types/k8s';
import { RefreshCw, AlertCircle, Layers, GitBranch } from 'lucide-react';

interface KubeFlowProps {
  initialData?: ClusterData | null;
  error?: string;
}

export function KubeFlow({ initialData, error }: KubeFlowProps) {
  const [data, setData] = useState<ClusterData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(error || null);
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<K8sNodeData | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('routing');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/k8s');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to fetch cluster data');
      }
      const newData = await response.json();
      setData(newData);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData && !error) {
      fetchData();
    }
  }, [initialData, error, fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const { nodes: graphNodes, edges: graphEdges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    return buildGraph(data, selectedNamespaces, viewMode);
  }, [data, selectedNamespaces, viewMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  useEffect(() => {
    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [graphNodes, graphEdges, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node: Node<K8sNodeData>) => {
    setSelectedNode(node.data);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const miniMapNodeColor = useCallback((node: Node<K8sNodeData>) => {
    const colors: Record<string, string> = {
      internet: '#9ca3af',
      ingresscontroller: '#f59e0b',
      proxy: '#fb923c',
      ingress: '#8b5cf6',
      route: '#a78bfa',
      service: '#3b82f6',
      deployment: '#22c55e',
      pod: '#14b8a6',
      configmap: '#f97316',
      secret: '#ef4444',
    };
    return colors[node.data.type] || '#9ca3af';
  }, []);

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{fetchError}</p>
          <div className="text-sm text-gray-500 mb-4">
            Make sure <code className="bg-gray-100 px-1 rounded">kubectl proxy</code> is running:
            <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded text-left overflow-x-auto">
              kubectl proxy
            </pre>
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setViewMode('routing')}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                viewMode === 'routing'
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Routing
            </button>
            <button
              onClick={() => setViewMode('resources')}
              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors border-l border-gray-300 ${
                viewMode === 'resources'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              Resources
            </button>
          </div>

          <NamespaceFilter
            namespaces={data?.namespaces || []}
            selected={selectedNamespaces}
            onChange={setSelectedNamespaces}
          />
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 text-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer text-gray-700">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-500"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
        </div>

        {/* Stats */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 text-xs text-gray-600 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow">
          <span>{nodes.length} resources</span>
          <span>|</span>
          <span>{edges.length} connections</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur p-3 rounded-lg shadow text-xs text-gray-700">
          <div className="font-semibold mb-2 text-gray-900">
            {viewMode === 'routing' ? 'Routing View' : 'Resources View'}
          </div>

          {viewMode === 'routing' ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gray-400"></span>
                <span>External Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500"></span>
                <span>Ingress Controller</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-violet-400"></span>
                <span>Route</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-500"></span>
                <span>Service</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-teal-500"></span>
                <span>Pod</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 text-gray-500">
                Shows how external traffic flows through the ingress controller to your services
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-purple-500"></span>
                  <span>Ingress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500"></span>
                  <span>Ingress Controller</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-blue-500"></span>
                  <span>Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-green-500"></span>
                  <span>Deployment</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-teal-500"></span>
                  <span>Pod</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-orange-500"></span>
                  <span>ConfigMap</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500"></span>
                  <span>Secret</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-gray-400"></div>
                  <span>Solid: Traffic flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-gray-400 border-dashed border-t-2 border-gray-400"></div>
                  <span>Dashed: Config reference</span>
                </div>
              </div>
            </>
          )}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={miniMapNodeColor}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="!bg-white/80"
          />
        </ReactFlow>
      </div>

      {selectedNode && (
        <DetailsPanel data={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}
