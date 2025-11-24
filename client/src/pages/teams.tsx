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
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [resetPasswordMemberId, setResetPasswordMemberId] = useState<string | null>(null);
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
      return apiRequest("POST", "/api/team-members/create", data);
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
    mutationFn: (memberId: string) => apiRequest("DELETE", `/api/team-members/${memberId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
      setSelectedMemberId(null);
      setShowDeleteDialog(false);
      toast({ title: "Miembro removido" });
    },
  });

  const toggleAccessMutation = useMutation({
    mutationFn: (data: { memberId: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/team-members/${data.memberId}`, { isActive: data.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
      toast({ title: "Acceso actualizado" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { memberId: string; newPassword: string; confirmPassword: string }) =>
      apiRequest("PATCH", `/api/team-members/${data.memberId}/reset-password`, { 
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
      setShowResetPasswordDialog(false);
      setNewPasswordForm({ newPassword: "", confirmPassword: "" });
      setResetPasswordMemberId(null);
      toast({ title: "Contraseña restablecida exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo restablecer la contraseña", variant: "destructive" });
    },
  });

  const handleEmailChange = async (email: string) => {
    setCreateForm({ ...createForm, email });
    setEmailAvailable(false);
    setEmailCheckError("");

    if (!email.includes("@")) {
      setEmailCheckError("Email inválido");
      return;
    }

    const result = await checkEmailMutation.mutateAsync(email);
    if (result.exists) {
      setEmailCheckError("Este email ya está en uso");
    } else {
      setEmailAvailable(true);
      setEmailCheckError("");
    }
  };

  const getPasswordValidation = () => {
    if (!createForm.password) return null;
    if (createForm.password.length < 6) return "Mínimo 6 caracteres";
    return "✓";
  };

  const getConfirmPasswordValidation = () => {
    if (!createForm.confirmPassword) return null;
    if (createForm.password !== createForm.confirmPassword) return "No coincide";
    return "✓";
  };

  const canSubmit = createForm.name.trim() && emailAvailable && createForm.password.length >= 6 && createForm.password === createForm.confirmPassword;

  const handleCreateMember = () => {
    if (!createForm.name.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    if (!emailAvailable) {
      toast({ title: "Error", description: "Valida que el email sea disponible", variant: "destructive" });
      return;
    }
    if (createForm.password.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    createMemberMutation.mutate(createForm);
  };

  const filteredMembers = members.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const activeCount = members.filter(m => m.isActive).length;
  const pausedCount = members.filter(m => !m.isActive).length;
  const adminCount = members.filter(m => m.role === "admin").length;

  if (!userId) return <LoadingSpinner />;
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col bg-background h-screen min-h-0">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">Mi Equipo de Trabajo</h1>
                  <p className="text-xs text-muted-foreground">Gestiona miembros del equipo con accesos personalizados</p>
                </div>
              </div>
              <Button onClick={() => setShowCreateModal(true)} data-testid="button-create-member" className="gap-2 h-9">
                <Plus className="w-4 h-4" />
                <span>Crear Miembro</span>
              </Button>
            </div>

            {/* Alert Banner */}
            <div className="mt-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-foreground">Crea miembros del equipo directamente</p>
              <p className="text-xs text-foreground/70 mt-0.5">Cada miembro tendrá su propia cuenta con nombre, email, contraseña y rol. Puedes pausar, restablecer contraseña, editar o eliminar en cualquier momento.</p>
            </div>

            {/* Stats and Search */}
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <StatCard label="Total" value={members.length} icon={Users} />
                <StatCard label="Activos" value={activeCount} icon={Activity} />
                <StatCard label="Pausados" value={pausedCount} icon={Pause} />
                <StatCard label="Admin" value={adminCount} icon={Users} />
              </div>
              <div className="relative">
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="p-4">
          <div className="max-w-7xl mx-auto">
            {filteredMembers.length === 0 && !searchQuery ? (
              <div className="border border-border rounded-lg flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Plus className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-foreground">Aún no hay miembros</h3>
                <p className="text-base text-muted-foreground mb-8 text-center max-w-md">
                  Crea miembros del equipo que trabajen contigo y accedan a tu cuenta
                </p>
                <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Primer Miembro
                </Button>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-16 border border-border rounded-lg">
                <p className="text-lg text-muted-foreground">No se encontraron miembros</p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {filteredMembers.map((member) => (
                  <Card
                    key={member.id}
                    className={`border transition-all hover-elevate cursor-pointer ${
                      selectedMemberId === member.id ? "border-primary/50 ring-2 ring-primary/20" : ""
                    } ${!member.isActive ? "opacity-60" : ""}`}
                    onClick={() => setSelectedMemberId(member.id)}
                    data-testid={`card-member-${member.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarFallback className="bg-primary/20 text-xs font-semibold">
                              {(member.name || "U").substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground truncate">
                              {member.name}
                              {member.isOwner && <span className="text-xs text-muted-foreground ml-1">(Propietario)</span>}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{member.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          <Badge variant={member.role === "admin" ? "default" : "secondary"} className="text-xs">
                            {member.role === "admin" ? "Admin" : member.role === "member" ? "Miembro" : "Visualizador"}
                          </Badge>
                          {!member.isActive && member.isMember && (
                            <Badge variant="outline" className="text-xs bg-orange-500/10">
                              Pausado
                            </Badge>
                          )}
                          {member.isMember && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAccessMutation.mutate({ memberId: member.id, isActive: !member.isActive });
                                }}
                                className="h-8 w-8"
                                data-testid={`button-toggle-access-${member.id}`}
                              >
                                {member.isActive ? <Pause className="w-3.5 h-3.5 text-orange-500" /> : <Play className="w-3.5 h-3.5 text-green-500" />}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResetPasswordMemberId(member.id);
                                  setShowResetPasswordDialog(true);
                                }}
                                className="h-8 w-8"
                                data-testid={`button-reset-password-${member.id}`}
                              >
                                <Key className="w-3.5 h-3.5 text-blue-500" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteMemberId(member.id);
                                  setShowDeleteDialog(true);
                                }}
                                className="h-8 w-8"
                                data-testid={`button-delete-member-${member.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            </div>
                          )}
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

      {/* Create Member Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Miembro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="member-name" className="text-xs">Nombre Completo</Label>
              <Input
                id="member-name"
                placeholder="Juan Pérez"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="h-8 text-xs mt-1"
                data-testid="input-member-name"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="member-email" className="text-xs">Email</Label>
              <div className="relative">
                <Input
                  id="member-email"
                  type="email"
                  placeholder="juan@empresa.com"
                  value={createForm.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`h-8 text-xs mt-1 pr-7 ${emailCheckError ? "border-destructive" : emailAvailable ? "border-green-500" : ""}`}
                  data-testid="input-member-email"
                  autoComplete="off"
                />
                {emailAvailable && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                {emailCheckError && <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />}
              </div>
              {emailCheckError && <p className="text-xs text-destructive mt-1">{emailCheckError}</p>}
            </div>
            <div>
              <Label htmlFor="member-password" className="text-xs">Contraseña</Label>
              <div className="relative">
                <Input
                  id="member-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className={`h-8 text-xs mt-1 pr-7 ${createForm.password && getPasswordValidation() !== "✓" ? "border-yellow-500" : ""}`}
                  data-testid="input-member-password"
                  autoComplete="new-password"
                />
                {getPasswordValidation() === "✓" && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                {getPasswordValidation() && getPasswordValidation() !== "✓" && <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />}
              </div>
              {getPasswordValidation() && getPasswordValidation() !== "✓" && <p className="text-xs text-yellow-600 mt-1">{getPasswordValidation()}</p>}
            </div>
            <div>
              <Label htmlFor="member-confirm-password" className="text-xs">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="member-confirm-password"
                  type="password"
                  placeholder="Repite la contraseña"
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                  className={`h-8 text-xs mt-1 pr-7 ${createForm.confirmPassword && getConfirmPasswordValidation() !== "✓" ? "border-destructive" : ""}`}
                  data-testid="input-member-confirm-password"
                  autoComplete="new-password"
                />
                {getConfirmPasswordValidation() === "✓" && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                {getConfirmPasswordValidation() && getConfirmPasswordValidation() !== "✓" && <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />}
              </div>
              {getConfirmPasswordValidation() && getConfirmPasswordValidation() !== "✓" && <p className="text-xs text-destructive mt-1">{getConfirmPasswordValidation()}</p>}
            </div>
            <div>
              <Label htmlFor="member-role" className="text-xs">Rol</Label>
              <select
                id="member-role"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full h-8 px-2 mt-1 bg-background border border-input rounded-md text-xs"
                data-testid="select-member-role"
              >
                <option value="admin">Admin</option>
                <option value="member">Miembro</option>
                <option value="viewer">Visualizador</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} size="sm">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateMember}
              disabled={!canSubmit || createMemberMutation.isPending}
              size="sm"
              data-testid="button-confirm-create-member"
            >
              {createMemberMutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">Restablecer Contraseña</DialogTitle>
            <DialogDescription className="text-xs">
              Para {selectedMember?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="new-password" className="text-xs">Nueva Contraseña</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPasswordForm.newPassword}
                onChange={(e) => setNewPasswordForm({ ...newPasswordForm, newPassword: e.target.value })}
                className="h-8 text-xs mt-1"
                data-testid="input-new-password"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-new-password" className="text-xs">Confirmar</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Repite la contraseña"
                value={newPasswordForm.confirmPassword}
                onChange={(e) => setNewPasswordForm({ ...newPasswordForm, confirmPassword: e.target.value })}
                className="h-8 text-xs mt-1"
                data-testid="input-confirm-new-password"
                autoComplete="new-password"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)} size="sm">
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (resetPasswordMemberId && newPasswordForm.newPassword && newPasswordForm.confirmPassword) {
                  resetPasswordMutation.mutate({ 
                    memberId: resetPasswordMemberId, 
                    newPassword: newPasswordForm.newPassword, 
                    confirmPassword: newPasswordForm.confirmPassword 
                  });
                }
              }}
              disabled={resetPasswordMutation.isPending}
              size="sm"
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? "Restableciendo..." : "Restablecer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">Eliminar Miembro</DialogTitle>
            <DialogDescription className="text-xs">
              ¿Remover a {selectedMember?.name}? No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} size="sm">
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
              size="sm"
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
