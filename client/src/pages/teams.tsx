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
import { Plus, Search, Trash2, Users, Activity, Pause, Play, Key, AlertCircle, Check, AlertTriangle, Eye, EyeOff, Edit2, LogIn } from "lucide-react";
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
  { id: "admin", label: "Admin", description: "Acceso completo a todos los módulos", permissions: 100 },
  { id: "member", label: "Miembro", description: "Acceso a crear, editar y leer", permissions: 75 },
  { id: "viewer", label: "Visualizador", description: "Solo lectura en todos los módulos", permissions: 30 },
];

// Color palette for member cards
const COLOR_PALETTE = [
  { name: "blue", border: "border-blue-500/30", cardBg: "bg-blue-500/5", headerFrom: "from-blue-500/30", headerTo: "to-blue-500/10", avatarFrom: "from-blue-500", avatarTo: "to-blue-600" },
  { name: "violet", border: "border-violet-500/30", cardBg: "bg-violet-500/5", headerFrom: "from-violet-500/30", headerTo: "to-violet-500/10", avatarFrom: "from-violet-500", avatarTo: "to-purple-600" },
  { name: "purple", border: "border-purple-500/30", cardBg: "bg-purple-500/5", headerFrom: "from-purple-500/30", headerTo: "to-purple-500/10", avatarFrom: "from-purple-500", avatarTo: "to-pink-600" },
  { name: "emerald", border: "border-emerald-500/30", cardBg: "bg-emerald-500/5", headerFrom: "from-emerald-500/30", headerTo: "to-emerald-500/10", avatarFrom: "from-emerald-500", avatarTo: "to-teal-600" },
  { name: "cyan", border: "border-cyan-500/30", cardBg: "bg-cyan-500/5", headerFrom: "from-cyan-500/30", headerTo: "to-cyan-500/10", avatarFrom: "from-cyan-500", avatarTo: "to-blue-600" },
  { name: "pink", border: "border-pink-500/30", cardBg: "bg-pink-500/5", headerFrom: "from-pink-500/30", headerTo: "to-pink-500/10", avatarFrom: "from-pink-500", avatarTo: "to-rose-600" },
  { name: "amber", border: "border-amber-500/30", cardBg: "bg-amber-500/5", headerFrom: "from-amber-500/30", headerTo: "to-amber-500/10", avatarFrom: "from-amber-500", avatarTo: "to-orange-600" },
  { name: "indigo", border: "border-indigo-500/30", cardBg: "bg-indigo-500/5", headerFrom: "from-indigo-500/30", headerTo: "to-indigo-500/10", avatarFrom: "from-indigo-500", avatarTo: "to-purple-600" },
];

const getCardColors = (memberId: string) => {
  // Create a simple hash from the member ID to select a consistent color
  let hash = 0;
  for (let i = 0; i < memberId.length; i++) {
    hash = ((hash << 5) - hash) + memberId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[colorIndex];
};

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
    role: "member",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetPasswordStrength, setResetPasswordStrength] = useState(0);
  const [showEditMemberDialog, setShowEditMemberDialog] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "member" });
  const [editEmailAvailable, setEditEmailAvailable] = useState(true);
  const [editFormErrors, setEditFormErrors] = useState<{ [key: string]: string }>({});

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
      setCreateForm({ name: "", email: "", password: "", role: "member" });
      setPasswordStrength(0);
      setEmailAvailable(false);
      setEmailCheckError("");
      setFormErrors({});
      setShowPassword(false);
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
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error updating member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members", userId] });
      toast({ title: "Miembro actualizado exitosamente" });
      setShowEditMemberDialog(false);
      setShowResetPasswordDialog(false);
      setMemberForResetPassword(null);
      setNewPasswordForm({ newPassword: "", confirmPassword: "" });
      setResetPasswordStrength(0);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar al miembro", variant: "destructive" });
    },
  });

  const handleCreateMember = () => {
    if (!validateForm()) {
      return;
    }

    createMemberMutation.mutate({
      name: createForm.name,
      email: createForm.email,
      password: createForm.password,
      role: createForm.role,
    });
  };

  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/\d/.test(pwd)) strength += 15;
    if (/[!@#$%^&*]/.test(pwd)) strength += 10;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength < 30) return { label: "Débil", color: "bg-red-500" };
    if (strength < 60) return { label: "Regular", color: "bg-orange-500" };
    if (strength < 80) return { label: "Fuerte", color: "bg-yellow-500" };
    return { label: "Muy Fuerte", color: "bg-green-500" };
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!createForm.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (!createForm.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = "Email inválido";
    } else if (!emailAvailable) {
      errors.email = "Email no disponible o no verificado";
    }

    if (!createForm.password) {
      errors.password = "La contraseña es requerida";
    } else if (createForm.password.length < 8) {
      errors.password = "Mínimo 8 caracteres";
    } else if (calculatePasswordStrength(createForm.password) < 30) {
      errors.password = "Contraseña demasiado débil";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCheckEmail = async (email: string) => {
    if (!email) {
      setEmailAvailable(false);
      return;
    }

    // Validar formato de email primero
    if (!isValidEmail(email)) {
      setEmailAvailable(false);
      setFormErrors(prev => ({ ...prev, email: "Email inválido" }));
      return;
    }

    // Si es válido, verificar disponibilidad
    try {
      const result = await checkEmailMutation.mutateAsync(email);
      if (result.available) {
        setEmailAvailable(true);
        setFormErrors(prev => ({ ...prev, email: "" }));
      } else {
        setEmailAvailable(false);
        setFormErrors(prev => ({ ...prev, email: "Este email ya está en uso" }));
      }
    } catch (error) {
      setEmailAvailable(false);
      setFormErrors(prev => ({ ...prev, email: "Error al verificar email" }));
    }
  };

  const handlePasswordChange = (pwd: string) => {
    setCreateForm({ ...createForm, password: pwd });
    setPasswordStrength(calculatePasswordStrength(pwd));
    if (pwd) {
      setFormErrors(prev => ({ ...prev, password: "" }));
    }
  };

  const isFormValid = () => {
    // Check all required fields and validations
    if (!createForm.name.trim()) return false;
    if (!createForm.email.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) return false;
    if (!emailAvailable) return false;
    if (!createForm.password) return false;
    if (createForm.password.length < 8) return false;
    if (calculatePasswordStrength(createForm.password) < 30) return false;
    return true;
  };

  const handleTestAccess = (member: TeamMember) => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("original_admin", JSON.stringify(currentUser));
    
    const simulatedUser = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role || "member",
      teamInfo: {
        teamMemberId: member.id,
        teamId: currentUser.id,
      },
      isSimulated: true,
    };
    
    localStorage.setItem("user", JSON.stringify(simulatedUser));
    toast({
      title: "Modo de prueba activado",
      description: `Viendo como: ${member.name} (${member.role})`,
    });
    
    window.location.href = "/";
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
    setResetPasswordStrength(0);
    setShowPasswordReset(false);
    setShowResetPasswordDialog(true);
  };

  const handleResetPasswordChange = (pwd: string) => {
    setNewPasswordForm(prev => ({ ...prev, newPassword: pwd }));
    setResetPasswordStrength(calculatePasswordStrength(pwd));
  };

  const isResetPasswordValid = () => {
    if (!newPasswordForm.newPassword) return false;
    if (newPasswordForm.newPassword.length < 8) return false;
    if (calculatePasswordStrength(newPasswordForm.newPassword) < 30) return false;
    if (!newPasswordForm.confirmPassword) return false;
    if (newPasswordForm.newPassword !== newPasswordForm.confirmPassword) return false;
    return true;
  };

  const handleConfirmResetPassword = () => {
    if (!isResetPasswordValid()) {
      toast({ title: "Error", description: "Completa todas las validaciones", variant: "destructive" });
      return;
    }

    const teamMemberId = memberForResetPassword.teamMemberId || memberForResetPassword.id;
    updateMemberMutation.mutate(
      {
        memberId: teamMemberId,
        data: { password: newPasswordForm.newPassword },
      },
      {
        onSuccess: () => {
          setShowResetPasswordDialog(false);
          setMemberForResetPassword(null);
          setNewPasswordForm({ newPassword: "", confirmPassword: "" });
          setResetPasswordStrength(0);
        },
      }
    );
  };

  const handleEditMember = (member: any) => {
    setMemberToEdit(member);
    setEditForm({ name: member.name, email: member.email, role: member.role });
    setEditEmailAvailable(true);
    setEditFormErrors({});
    setShowEditMemberDialog(true);
  };

  const handleSaveMember = async () => {
    const errors: { [key: string]: string } = {};

    if (!editForm.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (!editForm.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = "Email inválido";
    } else if (editForm.email !== memberToEdit.email) {
      // Check email availability only if changed
      try {
        const result = await checkEmailMutation.mutateAsync(editForm.email);
        if (!result.available) {
          errors.email = "Este email ya está en uso";
          setEditEmailAvailable(false);
        }
      } catch {
        errors.email = "Error al verificar email";
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    const teamMemberId = memberToEdit.teamMemberId || memberToEdit.id;
    updateMemberMutation.mutate(
      {
        memberId: teamMemberId,
        data: { name: editForm.name, email: editForm.email, role: editForm.role },
      },
      {
        onSuccess: () => {
          setShowEditMemberDialog(false);
          setEditForm({ name: "", email: "", role: "member" });
          setEditFormErrors({});
          setMemberToEdit(null);
          setEditEmailAvailable(false);
        },
      }
    );
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
      <div className="border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 sticky top-0 z-10 flex-shrink-0 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Add Button */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Teams</h1>
                <p className="text-xs text-muted-foreground/80">Gestiona los miembros de tu equipo</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} data-testid="button-add-member" className="gap-2 h-9">
              <Plus className="w-4 h-4" />
              <span>Agregar Miembro</span>
            </Button>
          </div>

          {/* Alert Banner */}
          <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Gestión de equipo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Aquí puedes crear, editar y gestionar los miembros de tu equipo. Asigna roles y permisos según sea necesario.</p>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground font-medium">Total</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{members.length}</p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground font-medium">Activos</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{members.filter((m) => m.isActive && !m.isOwner).length}</p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-violet-500" />
                <p className="text-xs text-muted-foreground font-medium">Propietario</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{members.filter((m) => m.isOwner).length}</p>
            </div>

            <div className="px-4 py-3 bg-muted/20 rounded-lg border border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <Pause className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-muted-foreground font-medium">Pausados</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{members.filter((m) => !m.isActive && !m.isOwner).length}</p>
            </div>
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

          {/* Members VCards Grid */}
          {filteredMembers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">No hay miembros que coincidan con tu búsqueda</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredMembers.map((member) => {
                const colors = getCardColors(member.id);
                const cardColors = member.isOwner 
                  ? { border: "border-blue-500/30", cardBg: "bg-blue-500/5", headerFrom: "from-blue-500/30", headerTo: "to-blue-500/10", avatarFrom: "from-blue-500", avatarTo: "to-blue-600" }
                  : colors;
                return (
                <Card key={member.id} className={`hover-elevate transition-all border-2 flex flex-col ${cardColors.border} ${cardColors.cardBg}`}>
                  {/* Card Header Background */}
                  <div className={`h-12 rounded-t-lg bg-gradient-to-br flex items-start justify-between p-2 ${cardColors.headerFrom} ${cardColors.headerTo}`}>
                    <div className="flex items-center gap-1">
                      {member.isOwner && (
                        <Badge className="text-[8px] px-1 py-0 font-bold uppercase bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 h-3.5">PROP</Badge>
                      )}
                      {!member.isActive && (
                        <Badge className="text-[8px] px-1 py-0 font-bold uppercase bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 h-3.5">PAUSADO</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 font-bold uppercase bg-background/50 border-border/50">
                      {AVAILABLE_ROLES.find(r => r.id === member.role)?.label || member.role}
                    </Badge>
                  </div>

                  {/* Card Body */}
                  <div className="flex-1 p-2 flex flex-col">
                    <div className="flex items-center gap-2 mb-2 -mt-5">
                      <Avatar className="w-9 h-9 flex-shrink-0 border-2 border-card shadow-md ring-1.5 ring-card">
                        <AvatarFallback className={`bg-gradient-to-br font-bold text-xs text-white ${cardColors.avatarFrom} ${cardColors.avatarTo}`}>
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-foreground truncate">{member.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Card Footer - Actions */}
                  {!member.isOwner && (
                    <div className="flex gap-1 p-2 border-t border-border/20 bg-muted/20">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleTestAccess(member)}
                        className="h-7 w-7 flex-1"
                        data-testid={`button-test-access-${member.id}`}
                        title="Ver como este miembro"
                      >
                        <LogIn className="w-3 h-3 text-green-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditMember(member)}
                        className="h-7 w-7 flex-1"
                        data-testid={`button-edit-member-${member.id}`}
                        title="Editar miembro"
                      >
                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleToggleStatus(member)}
                        className="h-7 w-7 flex-1"
                        data-testid={`button-toggle-status-${member.id}`}
                        title={member.isActive ? "Pausar" : "Activar"}
                      >
                        {member.isActive ? (
                          <Pause className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <Play className="w-3 h-3 text-green-500" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleResetPassword(member)}
                        className="h-7 w-7 flex-1"
                        data-testid={`button-reset-password-${member.id}`}
                        title="Cambiar contraseña"
                      >
                        <Key className="w-3 h-3 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteMember(member)}
                        className="h-7 w-7 flex-1"
                        data-testid={`button-delete-member-${member.id}`}
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </Card>
              );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Member Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        if (!open) {
          setCreateForm({ name: "", email: "", password: "", role: "member" });
          setPasswordStrength(0);
          setFormErrors({});
          setShowPassword(false);
        }
      }}>
        <DialogContent className="w-[95vw] max-w-sm max-h-[90vh] flex flex-col bg-card border border-border overflow-hidden p-0 rounded-lg">
          <DialogHeader className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-border/40">
            <DialogTitle className="text-base font-semibold text-foreground">Crear Nuevo Miembro</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Agrega un nuevo miembro a tu equipo
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-3.5 px-5 py-4">
              {/* Name Field */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                  Nombre *
                </Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={createForm.name}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, name: e.target.value });
                    if (e.target.value.trim()) setFormErrors(prev => ({ ...prev, name: "" }));
                  }}
                  className={`h-9 text-sm ${formErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  data-testid="input-member-name"
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@empresa.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  onBlur={() => handleCheckEmail(createForm.email)}
                  className={`h-9 text-sm ${formErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  data-testid="input-member-email"
                />
                {formErrors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.email}
                  </p>
                )}
                {emailAvailable && !formErrors.email && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Email disponible
                  </p>
                )}
              </div>

              {/* Password Field with Strength Meter */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={createForm.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`h-9 text-sm pr-9 ${formErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    data-testid="input-member-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {createForm.password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getPasswordStrengthLabel(passwordStrength).color}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-semibold ml-2 ${
                        passwordStrength < 30 ? "text-red-500" :
                        passwordStrength < 60 ? "text-orange-500" :
                        passwordStrength < 80 ? "text-yellow-500" :
                        "text-green-500"
                      }`}>
                        {getPasswordStrengthLabel(passwordStrength).label}
                      </span>
                    </div>
                  </div>
                )}

                {formErrors.password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-semibold text-foreground">
                  Rol *
                </Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
                  <SelectTrigger id="role" className="h-9 text-sm border-border" data-testid="select-member-role">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent align="start" className="min-w-[200px]">
                    {AVAILABLE_ROLES.map((role) => (
                      <SelectItem key={role.id} value={role.id} className="cursor-pointer">
                        <span className="font-semibold">{role.label}</span>
                        <span className="text-muted-foreground ml-1">({role.permissions}%)</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createForm.role && (
                  <div className="pt-2 px-3 py-3 bg-blue-500/10 rounded-md border border-blue-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {AVAILABLE_ROLES.find(r => r.id === createForm.role)?.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {AVAILABLE_ROLES.find(r => r.id === createForm.role)?.description}
                        </p>
                      </div>
                      <Badge className="ml-2 bg-blue-500/30 text-blue-600 dark:text-blue-300 border-blue-500/40 font-bold text-xs whitespace-nowrap">
                        {AVAILABLE_ROLES.find(r => r.id === createForm.role)?.permissions}%
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col gap-2 border-t border-border/40 px-5 py-3">
            {!isFormValid() && (
              <div className="text-xs text-muted-foreground text-center px-2 py-1.5 bg-muted/50 rounded">
                Completa todos los campos correctamente para crear el miembro
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 h-9 text-xs font-medium"
                data-testid="button-cancel-create"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateMember}
                disabled={createMemberMutation.isPending || !isFormValid()}
                className="flex-1 h-9 text-xs font-medium"
                data-testid="button-create-member"
              >
                {createMemberMutation.isPending ? "Creando..." : "Crear Miembro"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={showEditMemberDialog} onOpenChange={setShowEditMemberDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Editar Miembro</DialogTitle>
            <DialogDescription className="text-xs">
              Actualiza los datos de {memberToEdit?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5">
            {/* Name Field */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-semibold text-foreground">
                Nombre *
              </Label>
              <Input
                id="edit-name"
                placeholder="Nombre del miembro"
                value={editForm.name}
                onChange={(e) => {
                  setEditForm(prev => ({ ...prev, name: e.target.value }));
                  if (e.target.value.trim()) setEditFormErrors(prev => ({ ...prev, name: "" }));
                }}
                className={`h-9 text-sm ${editFormErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                data-testid="input-edit-name"
              />
              {editFormErrors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {editFormErrors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-xs font-semibold text-foreground">
                Email *
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="correo@empresa.com"
                value={editForm.email}
                onChange={(e) => {
                  setEditForm(prev => ({ ...prev, email: e.target.value }));
                  if (e.target.value.trim()) setEditFormErrors(prev => ({ ...prev, email: "" }));
                }}
                className={`h-9 text-sm ${editFormErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                data-testid="input-edit-email"
              />
              {editFormErrors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {editFormErrors.email}
                </p>
              )}
              {editEmailAvailable && !editFormErrors.email && editForm.email && editForm.email !== memberToEdit?.email && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Email disponible
                </p>
              )}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-xs font-semibold text-foreground">
                Rol *
              </Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger id="edit-role" className="h-9 text-sm border-border" data-testid="select-edit-role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-[200px]">
                  {AVAILABLE_ROLES.map((role) => (
                    <SelectItem key={role.id} value={role.id} className="cursor-pointer">
                      <span className="font-semibold">{role.label}</span>
                      <span className="text-muted-foreground ml-1">({role.permissions}%)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editForm.role && (
                <div className="pt-2 px-3 py-3 bg-blue-500/10 rounded-md border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {AVAILABLE_ROLES.find(r => r.id === editForm.role)?.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {AVAILABLE_ROLES.find(r => r.id === editForm.role)?.description}
                      </p>
                    </div>
                    <Badge className="ml-2 bg-blue-500/30 text-blue-600 dark:text-blue-300 border-blue-500/40 font-bold text-xs whitespace-nowrap">
                      {AVAILABLE_ROLES.find(r => r.id === editForm.role)?.permissions}%
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowEditMemberDialog(false)} size="sm" className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveMember} 
              size="sm" 
              disabled={updateMemberMutation.isPending}
              className="flex-1"
              data-testid="button-save-edit-member"
            >
              {updateMemberMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Restablecer Contraseña</DialogTitle>
            <DialogDescription className="text-xs">
              Nueva contraseña para {memberForResetPassword?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* New Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground">
                Nueva Contraseña *
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswordReset ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={newPasswordForm.newPassword}
                  onChange={(e) => handleResetPasswordChange(e.target.value)}
                  className="h-9 text-sm pr-9"
                  data-testid="input-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPasswordReset ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPasswordForm.newPassword && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getPasswordStrengthLabel(resetPasswordStrength).color}`}
                        style={{ width: `${resetPasswordStrength}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ml-2 ${
                      resetPasswordStrength < 30 ? "text-red-500" :
                      resetPasswordStrength < 60 ? "text-orange-500" :
                      resetPasswordStrength < 80 ? "text-yellow-500" :
                      "text-green-500"
                    }`}>
                      {getPasswordStrengthLabel(resetPasswordStrength).label}
                    </span>
                  </div>
                  {resetPasswordStrength < 30 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Contraseña muy débil
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword" className="text-xs font-semibold text-foreground">
                Confirmar Contraseña *
              </Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder="Repite la contraseña"
                value={newPasswordForm.confirmPassword}
                onChange={(e) => setNewPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="h-9 text-sm"
                data-testid="input-confirm-new-password"
              />
              {newPasswordForm.confirmPassword && newPasswordForm.newPassword && (
                <>
                  {newPasswordForm.newPassword === newPasswordForm.confirmPassword ? (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Las contraseñas coinciden
                    </p>
                  ) : (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Las contraseñas no coinciden
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)} size="sm" className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmResetPassword} 
              size="sm" 
              disabled={!isResetPasswordValid() || updateMemberMutation.isPending}
              className="flex-1"
              data-testid="button-confirm-reset-password"
            >
              {updateMemberMutation.isPending ? "Guardando..." : "Restablecer"}
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
