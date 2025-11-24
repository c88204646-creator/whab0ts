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
import { Plus, Users, Mail, Trash2, Shield } from "lucide-react";
import type { Team, TeamMember } from "@shared/schema";

interface TeamWithMembers extends Team {
  members?: TeamMember[];
}

export default function TeamsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: teams = [], isLoading } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/teams", userId],
    enabled: !!userId,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/teams", {
        ...data,
        ownerId: userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", userId] });
      setNewTeamName("");
      setNewTeamDescription("");
      toast({ title: "Team creado exitosamente" });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/teams/${data.teamId}/members`, {
        memberEmail: data.memberEmail,
        role: "member",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", userId] });
      setMemberEmail("");
      toast({ title: "Miembro agregado al team" });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => apiRequest("DELETE", `/api/teams/${teamId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", userId] });
      setSelectedTeamId(null);
      toast({ title: "Team eliminado" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => apiRequest("DELETE", `/api/team-members/${memberId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", userId] });
      toast({ title: "Miembro removido del team" });
    },
  });

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) {
      toast({ title: "Error", description: "El nombre del team es requerido", variant: "destructive" });
      return;
    }
    createTeamMutation.mutate({ name: newTeamName, description: newTeamDescription });
  };

  const handleAddMember = (teamId: string) => {
    if (!memberEmail.trim()) {
      toast({ title: "Error", description: "El email es requerido", variant: "destructive" });
      return;
    }
    addMemberMutation.mutate({ teamId, memberEmail });
  };

  if (!userId) return <div className="flex items-center justify-center h-full">Cargando...</div>;

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div className="h-full flex flex-col bg-background min-h-0">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Teams</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Gestiona tu equipo de trabajo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Create Team Section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Crear Nuevo Team</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="team-name">Nombre del Team</Label>
                    <Input
                      id="team-name"
                      placeholder="Mi Equipo de Ventas"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="mt-1"
                      data-testid="input-team-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="team-desc">Descripción (opcional)</Label>
                    <Input
                      id="team-desc"
                      placeholder="Equipo encargado de atender consultas de clientes..."
                      value={newTeamDescription}
                      onChange={(e) => setNewTeamDescription(e.target.value)}
                      className="mt-1"
                      data-testid="input-team-description"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateTeam}
                    disabled={createTeamMutation.isPending}
                    className="gap-2"
                    data-testid="button-create-team"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Team
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Teams Grid */}
            {isLoading ? (
              <div className="text-center py-8">Cargando teams...</div>
            ) : teams.length === 0 ? (
              <Card className="bg-muted/20 border-dashed">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-base font-medium text-foreground">No hay teams aún</p>
                  <p className="text-sm text-muted-foreground mt-2">Crea tu primer team para comenzar</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {teams.map((team) => (
                  <Card 
                    key={team.id}
                    className={`cursor-pointer transition-all hover-elevate ${
                      selectedTeamId === team.id ? "border-primary/50 ring-2 ring-primary/20" : ""
                    }`}
                    onClick={() => setSelectedTeamId(team.id)}
                    data-testid={`card-team-${team.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{team.name}</h3>
                          {team.description && (
                            <p className="text-xs text-muted-foreground mt-1">{team.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {team.members?.length || 0} miembros
                        </Badge>
                      </div>
                      
                      {/* Members Preview */}
                      {team.members && team.members.length > 0 && (
                        <div className="flex -space-x-2 mt-3">
                          {team.members.slice(0, 3).map((member) => (
                            <Avatar key={member.id} className="w-7 h-7 border border-background">
                              <AvatarFallback className="text-xs bg-primary/20">
                                {member.userId.substring(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {team.members.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-muted border border-background flex items-center justify-center text-xs text-muted-foreground">
                              +{team.members.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Team Details */}
            {selectedTeam && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedTeam.name}</h3>
                      {selectedTeam.description && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedTeam.description}</p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTeamMutation.mutate(selectedTeam.id)}
                      disabled={deleteTeamMutation.isPending}
                      data-testid={`button-delete-team-${selectedTeam.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>

                  {/* Add Member */}
                  <div className="bg-muted/20 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-sm mb-3">Agregar Miembro</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="email@ejemplo.com"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        className="flex-1"
                        data-testid="input-member-email"
                      />
                      <Button
                        onClick={() => handleAddMember(selectedTeam.id)}
                        disabled={addMemberMutation.isPending}
                        data-testid={`button-add-member-${selectedTeam.id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Members List */}
                  <div>
                    <h4 className="font-medium text-sm mb-3">Miembros ({selectedTeam.members?.length || 0})</h4>
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
                              <div className="flex-1">
                                <p className="text-sm font-medium">{member.userId}</p>
                                <Badge variant="outline" className="text-xs mt-1 flex w-fit">
                                  <Shield className="w-3 h-3 mr-1" />
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
                        <p className="text-sm text-muted-foreground">No hay miembros en este team</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
