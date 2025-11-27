import { useState } from "react";
import { useParams, useNavigate } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Square,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  List,
  Image as ImageIcon,
  MapPin,
  Zap,
} from "lucide-react";

interface FlowNode {
  id: string;
  type: "text" | "button" | "list" | "media" | "location" | "action";
  content: string;
  x: number;
  y: number;
  options?: string[];
}

interface FlowConnection {
  from: string;
  to: string;
}

export default function FlowBuilderPage() {
  const params = useParams();
  const id = params?.id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [flowName, setFlowName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nodeType, setNodeType] = useState<FlowNode["type"]>("text");
  const [nodeContent, setNodeContent] = useState("");

  const { data: flow } = useQuery({
    queryKey: [`/api/flows/${id}`],
    queryFn: async () => {
      if (!id) return null;
      const data = await apiRequest("GET", `/api/flows/${id}`);
      if (data?.flowData) {
        setNodes(data.flowData.nodes || []);
        setConnections(data.flowData.connections || []);
        setFlowName(data.name);
      }
      return data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No flow ID");
      return apiRequest("PATCH", `/api/flows/${id}`, {
        name: flowName,
        flowData: { nodes, connections },
      });
    },
    onSuccess: () => {
      toast({ title: "Flujo guardado" });
      queryClient.invalidateQueries({ queryKey: [`/api/flows/${id}`] });
    },
  });

  const componentIcons: Record<FlowNode["type"], any> = {
    text: MessageSquare,
    button: Square,
    list: List,
    media: ImageIcon,
    location: MapPin,
    action: Zap,
  };

  const addNode = (type: FlowNode["type"]) => {
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      content: nodeContent || `Nuevo ${type}`,
      x: Math.random() * 300 + 100,
      y: Math.random() * 300 + 100,
      options: type === "button" ? ["Opción 1", "Opción 2"] : undefined,
    };
    setNodes([...nodes, newNode]);
    setNodeContent("");
    setDialogOpen(false);
    toast({ title: "Componente agregado" });
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setConnections(connections.filter((c) => c.from !== nodeId && c.to !== nodeId));
    setSelectedNode(null);
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="page-flow-builder">
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/assistants")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <Input
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="Nombre del flujo"
              className="font-semibold"
              data-testid="input-flow-name"
            />
          </div>
        </div>
        <Button onClick={() => updateMutation.mutate()} data-testid="button-save">
          <Save className="w-4 h-4 mr-2" />
          Guardar
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-32 border-r bg-muted p-2 space-y-1 overflow-y-auto">
          {Object.entries(componentIcons).map(([type, Icon]) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => {
                setNodeType(type as FlowNode["type"]);
                setDialogOpen(true);
              }}
              data-testid={`button-add-${type}`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {type}
            </Button>
          ))}
        </div>

        <div className="flex-1 relative bg-white dark:bg-slate-950 overflow-auto">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" data-testid="svg-connections">
            {connections.map((conn, idx) => {
              const fromNode = nodes.find((n) => n.id === conn.from);
              const toNode = nodes.find((n) => n.id === conn.to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={idx}
                  x1={fromNode.x + 60}
                  y1={fromNode.y + 30}
                  x2={toNode.x + 60}
                  y2={toNode.y + 30}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-blue-500"
                  markerEnd="url(#arrowhead)"
                  data-testid={`line-connection-${idx}`}
                />
              );
            })}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-blue-500" />
              </marker>
            </defs>
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute p-3 rounded border-2 cursor-move hover-elevate min-w-32 ${
                selectedNode === node.id
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900"
              }`}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
              onClick={() => setSelectedNode(node.id)}
              data-testid={`node-${node.id}`}
            >
              <div className="flex items-start gap-2">
                {(() => {
                  const Icon = componentIcons[node.type];
                  return <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />;
                })()}
                <div className="flex-1 text-xs">
                  <div className="font-semibold">{node.type}</div>
                  <div className="text-muted-foreground truncate">{node.content}</div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                  data-testid={`button-delete-node-${node.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-add-node">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              Agregar {nodeType}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Contenido</label>
              <Input
                value={nodeContent}
                onChange={(e) => setNodeContent(e.target.value)}
                placeholder="Ingresa el contenido del mensaje"
                data-testid="input-node-content"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => addNode(nodeType)}
                data-testid="button-add"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
