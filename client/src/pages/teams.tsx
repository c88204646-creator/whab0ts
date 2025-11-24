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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Users, Activity, Pause, Play, Key, AlertCircle, Check } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { User } from "@shared/schema";

interface TeamMember extends User {
  id: string;
  role?: string;
  isActive?: boolean;
  isMember?: boolean;
  isOwner?: boolean;
}

// Roles disponibles - estos deberían venir de la API en una app real
const AVAILABLE_ROLES = [
  { id: "admin", label: "Admin", description: "Acceso completo a todos los módulos" },
  { id: "member", label: "Miembro", description: "Acceso a crear, editar y leer" },
  { id: "viewer", label: "Visualizador", description: "Solo lectura en todos los módulos" },
];

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

export default function TeamsPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memberToDeleteData, setMemberToDeleteData] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [memberForResetPassword, setMemberForResetPassword] = useState<any>(null);
  const [newPasswordForm, setNewPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [emailCheckError, setEmailCheckError] = useState("");
  const [emailAvailable, setEmailAvailable] = useState(false);
  
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "member",
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: members = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/team-members?userId=${userId}`);
      if (!response.ok) throw new Error("Error fetching team members");
      return response.json();
    },
    enabled: !!userId,
  });

  const checkEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/verify-email/${encodeURIComponent(email)}`);
      return response.json();
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/team-members/create?userId=" + userId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error creating member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
      toast({ title: "Miembro creado exitosamente" });
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", password: "", confirmPassword: "", role: "member" });
      setEmailAvailable(false);
      setEmailCheckError("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear al miembro", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (member: any) => {
      const teamMemberId = member.teamMemberId || member.id;
      const response = await fetch(`/api/team-members/${teamMemberId}?userId=${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        try {
          const error = await response.json();
          throw new Error(error.error || "Error deleting member");
        } catch {
          throw new Error("Error deleting member");
        }
      }
      try {
        return response.json();
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
      toast({ title: "Miembro eliminado exitosamente" });
      setShowDeleteDialog(false);
      setMemberToDeleteData(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar al miembro", variant: "destructive" });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, data }: any) => {
      const response = await fetch(`/api/team-members/${memberId}?userId=${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error updating member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
    },
  });

  const handleCreateMember = () => {
    if (!createForm.name.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (!emailAvailable) {
      toast({ title: "Error", description: "Verifica que el email sea válido", variant: "destructive" });
      return;
    }
    if (createForm.password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    createMemberMutation.mutate({
      name: createForm.name,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role,
    });
  };

  const handleCheckEmail = async (email: string) => {
    if (!email) return;
    const result = await checkEmailMutation.mutateAsync(email);
    if (result.available) {
      setEmailAvailable(true);
      setEmailCheckError("");
    } else {
      setEmailAvailable(false);
      setEmailCheckError("Este email ya está en uso");
    }
  };

  const handleDeleteMember = (member: any) => {
    setMemberToDeleteData(member);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (memberToDeleteData) {
      removeMemberMutation.mutate(memberToDeleteData);
    }
  };

  const handleResetPassword = (member: any) => {
    setMemberForResetPassword(member);
    setNewPasswordForm({ newPassword: "", confirmPassword: "" });
    setShowResetPasswordDialog(true);
  };

  const handleConfirmResetPassword = () => {
    if (newPasswordForm.newPassword.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPasswordForm.newPassword !== newPasswordForm.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    const teamMemberId = memberForResetPassword.teamMemberId || memberForResetPassword.id;
    updateMemberMutation.mutate({
      memberId: teamMemberId,
      data: { password: newPasswordForm.newPassword },
    });

    setShowResetPasswordDialog(false);
    setMemberForResetPassword(null);
    toast({ title: "Contraseña actualizada exitosamente" });
  };

  const handleToggleStatus = async (member: any) => {
    const teamMemberId = member.teamMemberId || member.id;
    updateMemberMutation.mutate({
      memberId: teamMemberId,
      data: { isActive: !member.isActive },
    });
  };

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background h-full">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10 flex-shrink-0 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Miembros del Equipo</h1>
                <p className="text-xs text-muted-foreground">Gestiona los miembros de tu equipo</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Agregar Miembro
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Total" value={members.length} icon={Users} />
            <StatCard label="Activos" value={members.filter((m) => m.isActive && !m.isOwner).length} icon={Activity} />
            <StatCard label="Propietario" value={members.filter((m) => m.isOwner).length} icon={Check} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-xs"
              data-testid="input-search-members"
            />
          </div>

          {/* Members Table */}
          {filteredMembers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No hay miembros que coincidan con tu búsqueda</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => (
                <Card key={member.id} className="hover-elevate">
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-primary/40 ring-2 ring-primary/20 transition-all duration-300">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-amber-500 text-white font-bold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                          {member.isOwner && <Badge className="text-xs px-1.5 py-0.5 font-bold uppercase text-xs">(PROPIETARIO)</Badge>}
                          {!member.isActive && <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-bold uppercase bg-destructive/10 text-destructive border-destructive/20">PAUSADO</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 font-bold uppercase">
                        {AVAILABLE_ROLES.find(r => r.id === member.role)?.label || member.role}
                      </Badge>
                      {!member.isOwner && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleToggleStatus(member)}
                            className="h-8 w-8"
                            data-testid={`button-toggle-status-${member.id}`}
                          >
                            {member.isActive ? (
                              <Pause className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-green-500" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleResetPassword(member)}
                            className="h-8 w-8"
                            data-testid={`button-reset-password-${member.id}`}
                          >
                            <Key className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteMember(member)}
                            className="h-8 w-8"
                            data-testid={`button-delete-member-${member.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Member Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Miembro</DialogTitle>
            <DialogDescription className="text-xs">
              Agrega un nuevo miembro a tu equipo y asigna su rol
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-xs">Nombre Completo</Label>
              <Input
                id="name"
                placeholder="Juan Pérez"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="h-8 text-xs mt-1"
                data-testid="input-member-name"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                placeholder="juan@empresa.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                onBlur={() => handleCheckEmail(createForm.email)}
                className="h-8 text-xs mt-1"
                data-testid="input-member-email"
              />
              {emailCheckError && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailCheckError}
                </p>
              )}
              {emailAvailable && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Email disponible
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-xs">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                className="h-8 text-xs mt-1"
                data-testid="input-member-password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-xs">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repite la contraseña"
                value={createForm.confirmPassword}
                onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                className="h-8 text-xs mt-1"
                data-testid="input-member-confirm-password"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-xs">Rol</Label>
              <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
                <SelectTrigger id="role" className="h-8 text-xs mt-1" data-testid="select-member-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} size="sm">
              Cancelar
            </Button>
            <Button onClick={handleCreateMember} size="sm" disabled={createMemberMutation.isPending} data-testid="button-create-member">
              {createMemberMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Restablecer Contraseña</DialogTitle>
            <DialogDescription className="text-xs">
              Nueva contraseña para {memberForResetPassword?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="newPassword" className="text-xs">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPasswordForm.newPassword}
                onChange={(e) => setNewPasswordForm({ ...newPasswordForm, newPassword: e.target.value })}
                className="h-8 text-xs mt-1"
                data-testid="input-new-password"
              />
            </div>

            <div>
              <Label htmlFor="confirmNewPassword" className="text-xs">Confirmar Contraseña</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder="Repite la contraseña"
                value={newPasswordForm.confirmPassword}
                onChange={(e) => setNewPasswordForm({ ...newPasswordForm, confirmPassword: e.target.value })}
                className="h-8 text-xs mt-1"
                data-testid="input-confirm-new-password"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)} size="sm">
              Cancelar
            </Button>
            <Button onClick={handleConfirmResetPassword} size="sm" data-testid="button-confirm-reset-password">
              Restablecer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Modal */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Eliminar Miembro
            </DialogTitle>
            <DialogDescription className="text-xs">
              ¿Estás seguro de que deseas eliminar a <strong>{memberToDeleteData?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} size="sm">
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} variant="destructive" size="sm" data-testid="button-confirm-delete-member">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
