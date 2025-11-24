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
import { CreateTeamModal } from "@/components/create-team-modal";
import { Plus, Search, Trash2, Pause, Play, Users, Activity, Lock, BarChart3, Eye } from "lucide-react";
import type { Team, TeamMember, TeamActivityLog } from "@shared/schema";

interface TeamWithDetails extends Team {
  members?: TeamMember[];
  moduleAccess?: any[];
}

const MODULES = [
  { id: "whatsapp", name: "WhatsApp", icon: "MessageCircle" },
  { id: "chatbots", name: "Chatbots", icon: "Bot" },
  { id: "calendar", name: "Calendario", icon: "Calendar" },
  { id: "surveys", name: "Encuestas", icon: "BarChart" },
  { id: "raffles", name: "Rifas", icon: "Ticket" },
  { id: "crm", name: "CRM", icon: "Users" },
  { id: "facebook", name: "Facebook", icon: "Facebook" },
];

export default function TeamsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [showActivityTab, setShowActivityTab] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: teams = [], isLoading } = useQuery<TeamWithDetails[]>({
    queryKey: ["/api/teams", userId],
    enabled: !!userId,
  });

  const { data: activityLogs = [] } = useQuery<TeamActivityLog[]>({
    queryKey: ["/api/teams", selectedTeamId, "activity"],
    enabled: !!selectedTeamId && showActivityTab,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: { name: string; password: string }) => {
      return apiRequest("POST", "/api/teams", {
        ownerId: userId,
        name: data.name,
        password: data.password,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", userId] });
      toast({ title: "Team creado exitosamente" });
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo crear el team",
        variant: "destructive"
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: (data: { teamId: string; isActive?: boolean }) =>
      apiRequest("PATCH", `/api/teams/${data.teamId}`, { isActive: data.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", userId] });
      toast({ title: "Team actualizado" });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => apiRequest("DELETE", `/api/teams/${teamId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", userId] });
      setSelectedTeamId(null);
      setShowDeleteDialog(false);
      toast({ title: "Team eliminado" });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: () => {
      if (!selectedTeamId) throw new Error("No team selected");
      if (!memberEmail.trim()) throw new Error("Email requerido");
      return apiRequest("POST", `/api/teams/${selectedTeamId}/members`, {
        memberEmail,
        role: "member",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", userId] });
      setMemberEmail("");
      toast({ title: "Miembro agregado" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest("DELETE", `/api/team-members/${memberId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", userId] });
      toast({ title: "Miembro removido" });
    },
  });

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const totalTeams = teams.length;
  const activeTeams = teams.filter((t) => t.isActive).length;
  const pausedTeams = totalTeams - activeTeams;

  if (!userId) return <div className="h-full flex items-center justify-center">Cargando...</div>;

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      {/* Professional Header Banner - like Conexiones WhatsApp */}
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Title and Add Button */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Gestión de Teams</h1>
                <p className="text-xs text-muted-foreground/80">Crea y administra equipos de trabajo con permisos granulares</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} data-testid="button-create-team" className="gap-2 h-9">
              <Plus className="w-4 h-4" />
              <span>Crear Team</span>
            </Button>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalTeams}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Activos</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{activeTeams}</p>
            </div>
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Pause className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Pausados</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{pausedTeams}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
              data-testid="input-search-teams"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">

            {/* Alert Banner */}
            {filteredTeams.length > 0 && selectedTeamId !== "create" && (
              <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold text-foreground">Gestiona tu equipo</p>
                <p className="text-xs text-foreground/70 mt-0.5">Asigna módulos, monitorea actividad y controla permisos de acceso</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">Cargando teams...</div>
            ) : filteredTeams.length === 0 && !searchQuery ? (
              <div className="border border-border rounded-lg flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-purple-500/10 dark:bg-purple-500/5 rounded-full flex items-center justify-center mb-6">
                  <Plus className="w-10 h-10 text-purple-500/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">No hay teams</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Crea tu primer equipo de trabajo para comenzar a colaborar y asignar accesos a módulos
                </p>
                <Button onClick={() => setSelectedTeamId("create")} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Primer Team
                </Button>
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-lg">
                <p className="text-lg text-muted-foreground">No se encontraron teams</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4 mb-6">
                {filteredTeams.map((team) => (
                  <Card
                    key={team.id}
                    className={`border transition-all hover-elevate cursor-pointer ${
                      selectedTeamId === team.id ? "border-purple-500/50 ring-2 ring-purple-500/20" : ""
                    } ${team.isActive ? "border-border" : "border-border/50 opacity-75"}`}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setShowActivityTab(false);
                    }}
                    data-testid={`card-team-${team.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-11 w-11 ring-2 ring-offset-1 ring-offset-background ring-border flex-shrink-0">
                            <AvatarFallback className="bg-purple-500/20 text-sm font-bold text-purple-600 dark:text-purple-400">
                              {team.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground truncate">{team.name}</div>
                            <div className="text-xs text-muted-foreground/80 mt-0.5">
                              {team.members?.length || 0} miembros
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTeamMutation.mutate({ teamId: team.id, isActive: !team.isActive });
                            }}
                            disabled={updateTeamMutation.isPending}
                            className="h-8 w-8 p-0"
                            title={team.isActive ? "Pausar" : "Activar"}
                            data-testid={`button-toggle-team-${team.id}`}
                          >
                            {team.isActive ? (
                              <Pause className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Play className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTeamId(team.id);
                              setShowDeleteDialog(true);
                            }}
                            disabled={deleteTeamMutation.isPending}
                            className="h-8 w-8 p-0"
                            data-testid={`button-delete-team-${team.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Estado</span>
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              team.isActive
                                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                            }`}
                          >
                            {team.isActive ? "Activo" : "Pausado"}
                          </span>
                        </div>
                        {team.password && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Lock className="w-3 h-3" />
                            <span>Protegido con contraseña</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Team Details Panel */}
            {selectedTeamId && selectedTeam && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  {/* Tabs */}
                  <div className="flex gap-2 mb-6 border-b border-border">
                    <button
                      onClick={() => setShowActivityTab(false)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        !showActivityTab ? "text-foreground border-b-2 border-purple-500" : "text-muted-foreground"
                      }`}
                    >
                      Configuración
                    </button>
                    <button
                      onClick={() => setShowActivityTab(true)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        showActivityTab ? "text-foreground border-b-2 border-purple-500" : "text-muted-foreground"
                      }`}
                    >
                      <Activity className="w-4 h-4 inline mr-2" />
                      Actividad
                    </button>
                  </div>

                  {!showActivityTab ? (
                    <div className="space-y-6">
                      {/* Team Info */}
                      <div>
                        <h4 className="font-semibold mb-2">Información del Team</h4>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="text-muted-foreground">Nombre:</span> {selectedTeam.name}</p>
                          {selectedTeam.password && (
                            <p className="text-sm flex items-center gap-2">
                              <Lock className="w-4 h-4" />
                              <span className="text-muted-foreground">Protegido con contraseña</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Add Member */}
                      <div className="bg-muted/20 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-3">Agregar Miembro</h4>
                        <div className="flex gap-2">
                          <Input
                            placeholder="email@ejemplo.com"
                            value={memberEmail}
                            onChange={(e) => setMemberEmail(e.target.value)}
                            className="flex-1 h-9"
                            data-testid="input-member-email"
                          />
                          <Button
                            onClick={() => addMemberMutation.mutate()}
                            disabled={addMemberMutation.isPending}
                            size="sm"
                            data-testid={`button-add-member-${selectedTeam.id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Members List */}
                      <div>
                        <h4 className="font-semibold mb-3">Miembros ({selectedTeam.members?.length || 0})</h4>
                        <div className="space-y-2">
                          {selectedTeam.members && selectedTeam.members.length > 0 ? (
                            selectedTeam.members.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback className="text-xs">
                                      {member.userId.substring(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{member.userId}</p>
                                    <Badge variant="outline" className="text-xs mt-1 flex w-fit">
                                      {member.role}
                                    </Badge>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMemberMutation.mutate(member.id)}
                                  disabled={removeMemberMutation.isPending}
                                  data-testid={`button-remove-member-${member.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No hay miembros aún</p>
                          )}
                        </div>
                      </div>

                      {/* Modules */}
                      <div>
                        <h4 className="font-semibold mb-3">Módulos Asignados</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {MODULES.map((module) => (
                            <div key={module.id} className="p-3 bg-muted/30 rounded-lg flex items-center gap-2">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{module.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-semibold mb-3">Actividad Reciente (últimas 24hrs)</h4>
                      {activityLogs.length > 0 ? (
                        activityLogs.map((log) => (
                          <div key={log.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                            <Activity className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium capitalize">{log.action}</p>
                              {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(log.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin actividad registrada</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Team</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar este team? Esta acción no puede ser revertida.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteTeamId) {
                  deleteTeamMutation.mutate(deleteTeamId);
                }
              }}
              disabled={deleteTeamMutation.isPending}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateTeamModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(data) => createTeamMutation.mutateAsync(data)}
        isLoading={createTeamMutation.isPending}
      />
    </div>
  );
}
