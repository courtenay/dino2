import dagre from '@dagrejs/dagre';
import type { Node, Edge } from 'reactflow';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

export interface LayoutOptions {
  direction: 'LR' | 'TB' | 'RL' | 'BT';
  nodeSpacing: number;
  rankSpacing: number;
}

const defaultOptions: LayoutOptions = {
  direction: 'LR',
  nodeSpacing: 50,
  rankSpacing: 150,
};

export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
): Node[] {
  const opts = { ...defaultOptions, ...options };
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSpacing,
    ranksep: opts.rankSpacing,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });
}
