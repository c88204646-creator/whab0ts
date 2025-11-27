import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Shield, AlertCircle, Users, Info, Eye, User, Check, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  SECTIONS,
  getModuleNamesForPermissions,
  PERMISSIONS,
  type PermissionType 
} from "@shared/modules";

const DYNAMIC_MODULES = getModuleNamesForPermissions();

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: Record<string, string[]>;
  usersCount?: number;
  isDefault?: boolean;
}

const DEFAULT_ROLES: Role[] = [
  {
    id: "administrador",
    name: "Administrador",
    color: "bg-blue-500",
    permissions: Object.fromEntries(DYNAMIC_MODULES.map(m => [m, ["read", "create", "edit", "delete"]])),
    usersCount: 0,
    isDefault: true,
  }
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

const getRoleIcon = (roleId: string) => {
  return Shield;
};

export default function RolesCreatorPage() {
  const { toast } = useToast();
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = userData.id;

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ["/api/roles", userId],
    enabled: !!userId,
  });

  const roles = useMemo(() => {
    if (!rolesData || rolesData.length === 0) {
      return DEFAULT_ROLES;
    }
    const rolesWithUpdatedModules = rolesData.map(role => {
      const updatedPermissions = { ...role.permissions };
      DYNAMIC_MODULES.forEach(mod => {
        if (!updatedPermissions[mod]) {
          updatedPermissions[mod] = ["read"];
        }
      });
      Object.keys(updatedPermissions).forEach(key => {
        if (!DYNAMIC_MODULES.includes(key)) {
          delete updatedPermissions[key];
        }
      });
      return { ...role, permissions: updatedPermissions };
    });
    return rolesWithUpdatedModules;
  }, [rolesData]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [localRoles, setLocalRoles] = useState<Role[]>(DEFAULT_ROLES);

  useEffect(() => {
    if (roles && roles.length > 0) {
      setLocalRoles(roles);
    }
  }, [roles]);

  const saveRoleMutation = useMutation({
    mutationFn: async (role: Role) => {
      return await apiRequest("POST", "/api/roles", { userId, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", userId] });
      toast({ title: "Rol guardado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: string; name?: string; permissions?: Record<string, string[]> }) => {
      return await apiRequest("PATCH", `/api/roles/${data.id}`, { ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", userId] });
      toast({ title: "Rol actualizado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return await apiRequest("DELETE", `/api/roles/${roleId}`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roles", userId] });
      toast({ title: "Rol eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast({ title: "Error", description: "El nombre del rol es requerido", variant: "destructive" });
      return;
    }

    if (localRoles.some(r => r.name.toLowerCase() === newRoleName.toLowerCase())) {
      toast({ title: "Error", description: "Ya existe un rol con este nombre", variant: "destructive" });
      return;
    }

    const newRole: Role = {
      id: `custom_${Date.now()}`,
      name: newRoleName,
      color: "bg-purple-500",
      permissions: Object.fromEntries(DYNAMIC_MODULES.map(m => [m, ["read"]])),
      usersCount: 0,
      isDefault: false,
    };

    setLocalRoles([...localRoles, newRole]);
    saveRoleMutation.mutate(newRole);
    setNewRoleName("");
    setShowCreateModal(false);
  };

  const handleDeleteRole = (role: Role) => {
    const userCount = Number(role.usersCount) || 0;
    if (userCount > 0) {
      toast({
        title: "No se puede eliminar",
        description: `Este rol tiene ${userCount} usuario(s) asignado(s). Reasigna los usuarios primero.`,
        variant: "destructive"
      });
      return;
    }

    if (role.isDefault) {
      toast({ title: "Error", description: "No puedes eliminar roles predefinidos del sistema", variant: "destructive" });
      return;
    }

    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (roleToDelete) {
      setLocalRoles(localRoles.filter(r => r.id !== roleToDelete.id));
      deleteRoleMutation.mutate(roleToDelete.id);
      setShowDeleteModal(false);
      setRoleToDelete(null);
    }
  };

  const handleStartEditName = (role: Role) => {
    if (role.isDefault) {
      toast({ title: "Error", description: "No puedes editar roles predefinidos del sistema", variant: "destructive" });
      return;
    }
    setEditingRoleId(role.id);
    setEditingRoleName(role.name);
  };

  const handleSaveRoleName = (roleId: string) => {
    if (!editingRoleName.trim()) {
      toast({ title: "Error", description: "El nombre del rol es requerido", variant: "destructive" });
      return;
    }

    if (localRoles.some(r => r.id !== roleId && r.name.toLowerCase() === editingRoleName.toLowerCase())) {
      toast({ title: "Error", description: "Ya existe un rol con este nombre", variant: "destructive" });
      return;
    }

    const updatedRoles = localRoles.map(r => r.id === roleId ? { ...r, name: editingRoleName } : r);
    setLocalRoles(updatedRoles);
    updateRoleMutation.mutate({ id: roleId, name: editingRoleName });
    setEditingRoleId(null);
    setEditingRoleName("");
  };

  const handlePermissionChange = (module: string, permission: string) => {
    if (!selectedRole) return;
    
    const modulePermissions = selectedRole.permissions[module] || [];
    let newPermissions;
    
    if (modulePermissions.includes(permission)) {
      newPermissions = modulePermissions.filter(p => p !== permission);
    } else {
      newPermissions = [...modulePermissions, permission];
    }

    const updatedRole = {
      ...selectedRole,
      permissions: { ...selectedRole.permissions, [module]: newPermissions }
    };

    setSelectedRole(updatedRole);
    setLocalRoles(localRoles.map(r => r.id === updatedRole.id ? updatedRole : r));
  };

  const handleSavePermissions = () => {
    if (selectedRole) {
      updateRoleMutation.mutate({ id: selectedRole.id, permissions: selectedRole.permissions });
      setShowPermissionsModal(false);
    }
  };

  const currentRoles = useMemo(() => {
    const rolesToSort = localRoles.length > 0 ? localRoles : DEFAULT_ROLES;
    // Separar roles personalizados y del sistema
    const customRoles = rolesToSort.filter(r => !r.isDefault);
    const systemRoles = rolesToSort.filter(r => r.isDefault);
    // Ordenar roles personalizados alfabéticamente, luego agregar roles del sistema
    const sortedCustom = customRoles.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return [...sortedCustom, ...systemRoles];
  }, [localRoles]);

  return (
    <div className="flex flex-col bg-background h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">Gestión de Roles</h1>
                  <p className="text-xs text-muted-foreground/80">Configura permisos y accesos por módulo</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} data-testid="button-add-role" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Crear Rol</span>
            </Button>
          </div>

          {/* Dynamic Modules Info */}
          <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Sistema de Módulos Dinámico</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Los módulos se detectan automáticamente. Actualmente hay <strong>{DYNAMIC_MODULES.length}</strong> módulos disponibles: {DYNAMIC_MODULES.join(", ")}.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total Roles" value={currentRoles.length} icon={Shield} />
            <StatCard label="Usuarios Asignados" value={currentRoles.reduce((sum, r) => sum + (r.usersCount || 0), 0)} icon={Users} />
            <StatCard label="Roles Personalizados" value={currentRoles.filter(r => !r.isDefault).length} icon={Plus} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {currentRoles.map((role, index) => {
              const RoleIcon = getRoleIcon(role.id);
              const isDefault = role.isDefault === true;
              const userCount = Number(role.usersCount) || 0;
              const canDelete = !isDefault && userCount === 0;
              const permissionCount = Object.values(role.permissions).flat().length;
              const enabledModules = DYNAMIC_MODULES.filter(m => (role.permissions[m]?.length || 0) > 0).length;

              return (
                <Card key={role.id} className="hover-elevate flex flex-col border border-border/40 bg-card overflow-hidden transition-all rounded-md h-40">
                  {/* Header ultra compacto */}
                  <div className="px-2 py-1.5 border-b border-border/30 flex items-center justify-between gap-1.5 bg-muted/5 flex-shrink-0">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div className={`w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 ${role.color} bg-opacity-20`}>
                        <RoleIcon className="w-2.5 h-2.5 text-foreground/70" />
                      </div>
                      {editingRoleId === role.id ? (
                        <div className="flex gap-0.5 items-center flex-1 min-w-0 h-5">
                          <Input
                            value={editingRoleName}
                            onChange={(e) => setEditingRoleName(e.target.value)}
                            className="h-full text-xs flex-1 py-0 px-1 bg-muted/40 border-muted/50 leading-none"
                            data-testid={`input-edit-role-name-${role.id}`}
                            autoFocus
                          />
                          <Button
                            size="icon"
                            onClick={() => handleSaveRoleName(role.id)}
                            className="h-5 w-5 p-0 flex-shrink-0"
                            data-testid={`button-save-role-name-${role.id}`}
                          >
                            <Check className="w-2 h-2" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="text-xs font-semibold text-foreground truncate leading-5">{role.name}</h3>
                      )}
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      {!isDefault && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEditName(role)}
                          className="h-5 w-5 p-0"
                          data-testid={`button-edit-role-name-${role.id}`}
                        >
                          <Edit2 className="w-2 h-2 text-muted-foreground" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteRole(role)}
                        className="h-5 w-5 p-0"
                        data-testid={`button-delete-role-${role.id}`}
                        disabled={!canDelete}
                      >
                        <Trash2 className={`w-2 h-2 transition-colors ${canDelete ? "text-muted-foreground" : "text-muted-foreground/30"}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Body comprimido con altura fija */}
                  <CardContent className="flex-1 p-1.5 flex flex-col gap-1 overflow-hidden min-h-0">
                    {/* Fila indicadores */}
                    <div className="flex items-center justify-between gap-1.5 px-1 py-0.5 text-xs flex-shrink-0">
                      <div className="flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground truncate">Usuarios:</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs px-1.5 py-0 h-4 font-medium bg-muted/20 border-border/40"
                      >
                        {userCount > 0 ? userCount : "—"}
                      </Badge>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border/30 mx-1 flex-shrink-0" />

                    {/* Módulos scrolleable */}
                    {enabledModules > 0 ? (
                      <div className="flex-1 flex flex-col gap-0 min-h-0 overflow-hidden">
                        <div className="flex items-center gap-0.5 px-1 pb-0.5 flex-shrink-0">
                          <Shield className="w-2 h-2 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground font-medium truncate leading-none">Accesos</span>
                          <span className="text-xs text-muted-foreground/50 ml-auto">({enabledModules})</span>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 pr-0.5 min-h-0">
                          <div className="flex flex-wrap gap-1 content-start">
                            {DYNAMIC_MODULES.map(module => {
                              const perms = role.permissions[module]?.length || 0;
                              return perms > 0 ? (
                                <Badge 
                                  key={module} 
                                  variant="outline" 
                                  className="text-xs px-1.5 py-0.5 h-5 font-medium bg-gradient-to-b from-muted/30 to-muted/20 text-muted-foreground border border-muted/50 whitespace-nowrap"
                                >
                                  {module.split(' ')[0]}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center px-1">
                        <p className="text-xs text-muted-foreground/50">—</p>
                      </div>
                    )}

                    {/* System badge */}
                    {isDefault && (
                      <div className="mx-1 pt-0.5 border-t border-border/20 flex-shrink-0">
                        <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 font-semibold whitespace-nowrap flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Sistema
                        </Badge>
                      </div>
                    )}

                    {/* Action button */}
                    <Button
                      onClick={() => {
                        setSelectedRole(role);
                        setShowPermissionsModal(true);
                      }}
                      size="sm"
                      className="w-full text-xs h-6 font-medium flex-shrink-0"
                      data-testid={`button-edit-permissions-${role.id}`}
                    >
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rol</DialogTitle>
            <DialogDescription className="text-xs">
              Define un nuevo rol personalizado para tu equipo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="role-name" className="text-xs">Nombre del Rol</Label>
              <Input
                id="role-name"
                placeholder="Ej: Supervisor"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="h-8 text-xs mt-1"
                data-testid="input-role-name"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)} size="sm">
              Cancelar
            </Button>
            <Button onClick={handleCreateRole} size="sm" data-testid="button-create-role">
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      {selectedRole && (
        <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Permisos de {selectedRole.name}</DialogTitle>
              <DialogDescription className="text-xs">
                Configura qué puede hacer este rol en cada módulo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {DYNAMIC_MODULES.map(module => (
                <div key={module} className="border border-border rounded-lg p-3">
                  <p className="font-semibold text-sm mb-2">{module}</p>
                  <div className="space-y-2">
                    {PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedRole.permissions[module]?.includes(perm.id) || false}
                          onCheckedChange={() => handlePermissionChange(module, perm.id)}
                          data-testid={`checkbox-${module}-${perm.id}`}
                        />
                        <span className="text-xs text-foreground">{perm.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{perm.description}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowPermissionsModal(false)} size="sm">
                Cancelar
              </Button>
              <Button onClick={handleSavePermissions} size="sm">
                Guardar Permisos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Role Modal */}
      {roleToDelete && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Eliminar Rol
              </DialogTitle>
              <DialogDescription className="text-xs">
                ¿Estás seguro de que deseas eliminar el rol <strong>"{roleToDelete.name}"</strong>? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} size="sm">
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelete} variant="destructive" size="sm" data-testid="button-confirm-delete-role">
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
