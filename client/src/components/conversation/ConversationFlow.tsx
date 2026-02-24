"use client"

import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Position,
  MarkerType,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Card } from '@/components/ui/card';

const nodeWidth = 250;
const nodeHeight = 100;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    }),
    edges,
  };
};

interface ConversationFlowProps {
  conversation: {
    messages: Array<{
      id: string;
      source: 'user' | 'ai';
      message: string;
      timestamp: string;
    }>;
  };
}

interface NodeData {
  message: string;
  timestamp: string;
}

function UserNode({ data }: { data: NodeData }) {
  return (
    <Card className="p-4 border-2 border-blue-500 bg-blue-50">
      <div className="font-medium text-sm text-blue-700">User Message</div>
      <div className="mt-2 text-sm">{data.message}</div>
      <div className="mt-2 text-xs text-gray-500">{data.timestamp}</div>
    </Card>
  );
}

function AINode({ data }: { data: NodeData }) {
  return (
    <Card className="p-4 border-2 border-purple-500 bg-purple-50">
      <div className="font-medium text-sm text-purple-700">AI Response</div>
      <div className="mt-2 text-sm">{data.message}</div>
      <div className="mt-2 text-xs text-gray-500">{data.timestamp}</div>
    </Card>
  );
}

const nodeTypes = {
  user: UserNode,
  ai: AINode,
};

export default function ConversationFlow({ conversation }: ConversationFlowProps) {
  // Convert messages to nodes and edges
  const initialNodes: Node[] = conversation.messages.map((msg, index) => ({
    id: msg.id,
    type: msg.source,
    position: { x: 0, y: 0 }, // Will be calculated by dagre
    data: {
      message: msg.message,
      timestamp: msg.timestamp,
    },
  }));

  const initialEdges: Edge[] = conversation.messages.slice(1).map((msg, index) => ({
    id: `e${index}`,
    source: conversation.messages[index].id,
    target: msg.id,
    animated: true,
    style: { stroke: '#6366f1' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  }));

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges]);

  return (
    <div className="w-full h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Panel position="top-right">
          <button
            onClick={onLayout}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Reset Layout
          </button>
        </Panel>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
