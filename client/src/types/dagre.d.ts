declare module 'dagre' {
  namespace graphlib {
    class Graph {
      setGraph(label: { rankdir?: string }): void;
      setDefaultEdgeLabel(callback: () => object): void;
      setNode(id: string, config: { width: number; height: number }): void;
      setEdge(source: string, target: string): void;
      node(id: string): { x: number; y: number };
    }
  }

  function layout(graph: graphlib.Graph): void;
}
