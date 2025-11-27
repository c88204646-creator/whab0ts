import { useCallback, useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  Plus,
  Save,
  MessageSquare,
  SquareFork,
  CheckSquare,
  Zap,
  Trash2,
  Copy,
  Settings,
  Play,
} from "lucide-react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/loading-spinner";

interface ChatbotNode extends Node {
  data: {
    label: string;
    content?: string;
    options?: string[];
    condition?: string;
    type: "message" | "buttons" | "condition" | "action" | "start" | "end";
  };
}

interface CustomEdge extends Edge {
  label?: string;
}

const nodeTypes = {
  message: { icon: MessageSquare, label: "Mensaje", color: "bg-blue-500/15 border-blue-500/40" },
  buttons: { icon: SquareFork, label: "Botones", color: "bg-purple-500/15 border-purple-500/40" },
  condition: { icon: CheckSquare, label: "Condición", color: "bg-orange-500/15 border-orange-500/40" },
  action: { icon: Zap, label: "Acción", color: "bg-green-500/15 border-green-500/40" },
  start: { icon: Play, label: "Inicio", color: "bg-emerald-500/15 border-emerald-500/40" },
  end: { icon: CheckSquare, label: "Fin", color: "bg-red-500/15 border-red-500/40" },
};

const CustomNode = ({ data, selected }: any) => {
  const nodeConfig = nodeTypes[data.type];
  const Icon = nodeConfig.icon;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-48 shadow-lg transition-all ${
        selected ? "ring-2 ring-primary" : ""
      } ${nodeConfig.color}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="font-semibold text-xs">{nodeConfig.label}</span>
      </div>
      <div className="text-xs text-muted-foreground line-clamp-3">{data.label}</div>
    </div>
  );
};

export default function FlowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [flowName, setFlowName] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<ChatbotNode | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeContent, setNodeContent] = useState("");
  const [nodeOptions, setNodeOptions] = useState("");
  const [nodeType, setNodeType] = useState<ChatbotNode["data"]["type"]>("message");

  const { data: flow, isLoading } = useQuery({
    queryKey: [`/api/flows/${id}`],
    queryFn: async () => {
      if (!id) return null;
      const data = await apiRequest("GET", `/api/flows/${id}`);
      if (data?.flowData) {
        setFlowName(data.name);
        setNodes(data.flowData.nodes || []);
        setEdges(data.flowData.edges || []);
      }
      return data;
    },
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No flow ID");
      return apiRequest("PATCH", `/api/flows/${id}`, {
        name: flowName,
        flowData: { nodes, edges },
      });
    },
    onSuccess: () => {
      toast({ title: "Flujo guardado correctamente" });
      queryClient.invalidateQueries({ queryKey: [`/api/flows/${id}`] });
    },
    onError: (error: any) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const addNode = () => {
    const newNode: ChatbotNode = {
      id: `node-${Date.now()}`,
      data: {
        label: "Nuevo nodo",
        type: "message",
      },
      position: { x: Math.random() * 500, y: Math.random() * 300 },
    };
    setNodes((nds) => [...nds, newNode]);
    toast({ title: "Nodo agregado" });
  };

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  const handleNodeClick = (_: any, node: Node) => {
    setSelectedNode(node.id);
    const chatNode = node as ChatbotNode;
    setEditingNode(chatNode);
    setNodeLabel(chatNode.data.label);
    setNodeContent(chatNode.data.content || "");
    setNodeOptions((chatNode.data.options || []).join("\n"));
    setNodeType(chatNode.data.type);
  };

  const updateSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode
          ? {
              ...node,
              data: {
                ...node.data,
                label: nodeLabel,
                content: nodeContent,
                options: nodeOptions.split("\n").filter((o) => o.trim()),
                type: nodeType,
              },
            }
          : node
      )
    );

    setShowNodeEditor(false);
    toast({ title: "Nodo actualizado" });
  };

  const duplicateNode = () => {
    if (!selectedNode) return;
    const node = nodes.find((n) => n.id === selectedNode) as ChatbotNode;
    if (!node) return;

    const newNode: ChatbotNode = {
      ...node,
      id: `node-${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
    };
    setNodes((nds) => [...nds, newNode]);
    toast({ title: "Nodo duplicado" });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Button size="icon" variant="ghost" onClick={() => setLocation("/flows")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <Input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Nombre del flujo"
              className="h-8 text-xs font-semibold"
              data-testid="input-flow-name"
            />
          </div>
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="h-8 text-xs px-3"
        >
          <Save className="w-3 h-3 mr-1.5" />
          {saveMutation.isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 overflow-hidden p-4">
        {/* Canvas */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border overflow-hidden">
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              type: "default",
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={{ default: CustomNode as any }}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Right Sidebar - Controls */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto">
          {/* Node Palette */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Componentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(nodeTypes).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant="outline"
                    className="w-full justify-start h-8 text-xs"
                    onClick={() => {
                      setNodeType(type as any);
                      setNodeLabel(config.label);
                      setNodeContent("");
                      setNodeOptions("");
                      setEditingNode(null);
                      setShowNodeEditor(false);
                      addNode();
                    }}
                  >
                    <Icon className="w-3 h-3 mr-2" />
                    {config.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Selected Node Info */}
          {selectedNode && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Nodo Seleccionado</CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => deleteNode(selectedNode)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs"
                  onClick={() => setShowNodeEditor(true)}
                >
                  <Settings className="w-3 h-3 mr-1.5" />
                  Editar Nodo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs"
                  onClick={duplicateNode}
                >
                  <Copy className="w-3 h-3 mr-1.5" />
                  Duplicar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Flow Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nodos:</span>
                <span className="font-semibold">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Conexiones:</span>
                <span className="font-semibold">{edges.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Node Editor Dialog */}
      <Dialog open={showNodeEditor} onOpenChange={setShowNodeEditor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Editar Nodo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1.5 block">Tipo</Label>
              <select
                value={nodeType}
                onChange={(e) => setNodeType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-border rounded-md bg-background"
              >
                {Object.entries(nodeTypes).map(([type, config]) => (
                  <option key={type} value={type}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">Etiqueta</Label>
              <Input
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                placeholder="Ej: Bienvenido"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs mb-1.5 block">Contenido del Mensaje</Label>
              <Textarea
                value={nodeContent}
                onChange={(e) => setNodeContent(e.target.value)}
                placeholder="Escribe el mensaje que verá el usuario"
                className="min-h-20 text-xs resize-none"
              />
            </div>

            {nodeType === "buttons" && (
              <div>
                <Label className="text-xs mb-1.5 block">Opciones de Botones</Label>
                <Textarea
                  value={nodeOptions}
                  onChange={(e) => setNodeOptions(e.target.value)}
                  placeholder="Una opción por línea&#10;Ej:&#10;Opción 1&#10;Opción 2&#10;Opción 3"
                  className="min-h-20 text-xs resize-none"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowNodeEditor(false)}
                size="sm"
                className="h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={updateSelectedNode}
                size="sm"
                className="h-8 text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
