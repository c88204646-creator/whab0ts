import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Users, Activity, Lock, BarChart3, Eye, Info, Shield, Mail } from "lucide-react";
import type { User } from "@shared/schema";

const MODULES = [
  { id: "whatsapp", name: "WhatsApp", icon: Shield },
  { id: "chatbots", name: "Chatbots", icon: Shield },
  { id: "calendar", name: "Calendario", icon: Shield },
  { id: "surveys", name: "Encuestas", icon: Shield },
  { id: "raffles", name: "Rifas", icon: Shield },
  { id: "crm", name: "CRM", icon: Shield },
  { id: "facebook", name: "Facebook", icon: Shield },
];

interface TeamMember extends User {
  role?: string;
  moduleAccess?: any[];
}

export default function TeamsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members", userId],
    enabled: !!userId,
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/team-members/invite", {
        email,
        role: selectedRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
      toast({ title: "Miembro invitado exitosamente" });
      setShowInviteModal(false);
      setInviteEmail("");
      setSelectedRole("member");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo invitar al miembro",
        variant: "destructive"
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest("DELETE", `/api/team-members/${memberId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
      setSelectedMemberId(null);
      setShowDeleteDialog(false);
      toast({ title: "Miembro removido" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (data: { memberId: string; role: string }) =>
      apiRequest("PATCH", `/api/team-members/${data.memberId}`, { role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
      toast({ title: "Rol actualizado" });
    },
  });

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const adminCount = members.filter((m) => m.role === "admin").length;
  const memberCount = members.filter((m) => m.role === "member").length;
  const viewerCount = members.filter((m) => m.role === "viewer").length;

  if (!userId) return <div className="h-full flex items-center justify-center">Cargando...</div>;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Mi Equipo de Trabajo</h1>
                <p className="text-xs text-muted-foreground/80">Invita y gestiona colaboradores de tu cuenta</p>
              </div>
            </div>
            <Button onClick={() => setShowInviteModal(true)} data-testid="button-invite-member" className="gap-2 h-9">
              <Plus className="w-4 h-4" />
              <span>Invitar Miembro</span>
            </Button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{members.length}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground font-medium">Admin</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{adminCount}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Miembro</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{memberCount}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Visualizador</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{viewerCount}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
              data-testid="input-search-members"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">

            {/* Info Alert */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">¿Qué es Mi Equipo?</p>
                <p className="text-xs text-foreground/70 mt-1">Invita colaboradores para que accedan a tu cuenta. Cada miembro puede tener diferentes roles (Admin, Miembro, Visualizador) con acceso a módulos específicos como WhatsApp, Chatbots, Calendario, Encuestas, Rifas y CRM.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Cargando miembros...</div>
            ) : filteredMembers.length === 0 && !searchQuery ? (
              <div className="border border-border rounded-lg flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-500/5 rounded-full flex items-center justify-center mb-6">
                  <Plus className="w-10 h-10 text-blue-500/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">Aún no hay miembros</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Invita a colaboradores para que trabajen en tu cuenta y puedan acceder a tus módulos
                </p>
                <Button onClick={() => setShowInviteModal(true)} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Invitar Primer Miembro
                </Button>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-lg">
                <p className="text-lg text-muted-foreground">No se encontraron miembros</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4 mb-6">
                {filteredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className={`border transition-all hover-elevate cursor-pointer ${
                      selectedMemberId === member.id ? "border-blue-500/50 ring-2 ring-blue-500/20" : ""
                    }`}
                    onClick={() => setSelectedMemberId(member.id)}
                    data-testid={`card-member-${member.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-10 w-10 ring-2 ring-offset-1 ring-offset-background ring-border flex-shrink-0">
                            <AvatarFallback className="bg-blue-500/20 text-sm font-bold text-blue-600 dark:text-blue-400">
                              {(member.name || "U").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground">{member.name || "Usuario"}</div>
                            <div className="text-xs text-muted-foreground/80 mt-0.5 flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role === "admin" ? "default" : "secondary"} className="text-xs">
                            {member.role === "admin" ? "Admin" : member.role === "member" ? "Miembro" : "Visualizador"}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteMemberId(member.id);
                              setShowDeleteDialog(true);
                            }}
                            data-testid={`button-delete-member-${member.id}`}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Invitar Miembro</DialogTitle>
            <DialogDescription>
              Invita a un colaborador para que acceda a tu cuenta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Correo del Miembro</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colaborador@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-2 h-9"
                data-testid="input-invite-email"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Rol</Label>
              <select
                id="invite-role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-9 px-3 mt-2 bg-background border border-input rounded-md text-sm"
                data-testid="select-member-role"
              >
                <option value="admin">Admin - Acceso completo</option>
                <option value="member">Miembro - Acceso a módulos asignados</option>
                <option value="viewer">Visualizador - Solo lectura</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => inviteMemberMutation.mutate(inviteEmail)}
              disabled={!inviteEmail || inviteMemberMutation.isPending}
              data-testid="button-confirm-invite"
            >
              {inviteMemberMutation.isPending ? "Invitando..." : "Enviar Invitación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Miembro</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas remover a {selectedMember?.name} del equipo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteMemberId) {
                  removeMemberMutation.mutate(deleteMemberId);
                }
              }}
              disabled={removeMemberMutation.isPending}
              data-testid="button-confirm-delete-member"
            >
              {removeMemberMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
