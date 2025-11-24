import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Shield, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const MODULES = [
  "WhatsApp", "Chatbots", "Calendario", "Encuestas", "Rifas", "CRM", "Facebook", "Tiendas"
];

const PERMISSIONS = [
  { id: "read", label: "Leer" },
  { id: "create", label: "Crear" },
  { id: "edit", label: "Editar" },
  { id: "delete", label: "Eliminar" },
];

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: Record<string, string[]>;
  usersCount?: number;
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

export default function RolesCreatorPage() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "admin",
      name: "Admin",
      color: "bg-blue-500",
      permissions: Object.fromEntries(MODULES.map(m => [m, ["read", "create", "edit", "delete"]])),
      usersCount: 2,
    },
    {
      id: "member",
      name: "Miembro",
      color: "bg-green-500",
      permissions: Object.fromEntries(MODULES.map(m => [m, ["read", "create", "edit"]])),
      usersCount: 5,
    },
    {
      id: "viewer",
      name: "Visualizador",
      color: "bg-gray-500",
      permissions: Object.fromEntries(MODULES.map(m => [m, ["read"]])),
      usersCount: 0,
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const { toast } = useToast();

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast({ title: "Error", description: "El nombre del rol es requerido", variant: "destructive" });
      return;
    }

    // Validar que el nombre no exista
    if (roles.some(r => r.name.toLowerCase() === newRoleName.toLowerCase())) {
      toast({ title: "Error", description: "Ya existe un rol con este nombre", variant: "destructive" });
      return;
    }

    const newRole: Role = {
      id: Date.now().toString(),
      name: newRoleName,
      color: "bg-purple-500",
      permissions: Object.fromEntries(MODULES.map(m => [m, ["read"]])),
      usersCount: 0,
    };

    setRoles([...roles, newRole]);
    setNewRoleName("");
    setShowCreateModal(false);
    toast({ title: "Rol creado exitosamente" });
  };

  const handleDeleteRole = (role: Role) => {
    if (role.usersCount && role.usersCount > 0) {
      toast({
        title: "No se puede eliminar",
        description: `Este rol tiene ${role.usersCount} usuario(s) asignado(s). Reasigna los usuarios primero.`,
        variant: "destructive"
      });
      return;
    }

    if (["admin", "member", "viewer"].includes(role.id)) {
      toast({ title: "Error", description: "No puedes eliminar roles predefinidos", variant: "destructive" });
      return;
    }

    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (roleToDelete) {
      setRoles(roles.filter(r => r.id !== roleToDelete.id));
      toast({ title: "Rol eliminado exitosamente" });
      setShowDeleteModal(false);
      setRoleToDelete(null);
    }
  };

  const handleStartEditName = (role: Role) => {
    if (["admin", "member", "viewer"].includes(role.id)) {
      toast({ title: "Error", description: "No puedes editar roles predefinidos", variant: "destructive" });
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

    if (roles.some(r => r.id !== roleId && r.name.toLowerCase() === editingRoleName.toLowerCase())) {
      toast({ title: "Error", description: "Ya existe un rol con este nombre", variant: "destructive" });
      return;
    }

    setRoles(roles.map(r => r.id === roleId ? { ...r, name: editingRoleName } : r));
    setEditingRoleId(null);
    setEditingRoleName("");
    toast({ title: "Nombre del rol actualizado" });
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
    setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
  };

  return (
    <div className="flex flex-col bg-background h-full">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10 flex-shrink-0 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Gestión de Roles</h1>
                <p className="text-xs text-muted-foreground">Configura permisos y accesos por módulo</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Crear Rol
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Total Roles" value={roles.length} icon={Shield} />
            <StatCard label="Usuarios Asignados" value={roles.reduce((sum, r) => sum + (r.usersCount || 0), 0)} icon={Users} />
            <StatCard label="Roles Personalizados" value={roles.filter(r => !["admin", "member", "viewer"].includes(r.id)).length} icon={Plus} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="hover-elevate flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingRoleId === role.id ? (
                        <div className="flex gap-2 items-center mb-2">
                          <Input
                            value={editingRoleName}
                            onChange={(e) => setEditingRoleName(e.target.value)}
                            className="h-7 text-sm flex-1"
                            data-testid={`input-edit-role-name-${role.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSaveRoleName(role.id)}
                            className="h-7 px-2 text-xs"
                            data-testid={`button-save-role-name-${role.id}`}
                          >
                            Guardar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {["admin", "member", "viewer"].includes(role.id) && (
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          )}
                          {role.usersCount && role.usersCount > 0 && (
                            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          )}
                          <CardTitle className="text-base break-words">{role.name}</CardTitle>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!["admin", "member", "viewer"].includes(role.id) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleStartEditName(role)}
                          className="h-8 w-8"
                          data-testid={`button-edit-role-name-${role.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteRole(role)}
                        className="h-8 w-8"
                        data-testid={`button-delete-role-${role.id}`}
                        disabled={["admin", "member", "viewer"].includes(role.id) || (role.usersCount || 0) > 0}
                      >
                        <Trash2 className={`w-3.5 h-3.5 ${(["admin", "member", "viewer"].includes(role.id) || (role.usersCount && role.usersCount > 0)) ? "text-muted-foreground opacity-50" : "text-destructive"}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${role.color} text-white text-xs`}>{role.name}</Badge>
                      {role.usersCount ? (
                        <Badge variant="secondary" className="text-xs">
                          {role.usersCount} usuario{role.usersCount !== 1 ? 's' : ''}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p className="font-semibold mb-1">Módulos permitidos:</p>
                      <div className="flex flex-wrap gap-1">
                        {MODULES.map(module => (
                          (role.permissions[module]?.length > 0) && (
                            <Badge key={module} variant="outline" className="text-xs">{module}</Badge>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role);
                      setShowPermissionsModal(true);
                    }}
                    className="mt-3 text-xs h-8"
                    data-testid={`button-edit-permissions-${role.id}`}
                  >
                    Editar Permisos
                  </Button>
                </CardContent>
              </Card>
            ))}
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
              {MODULES.map(module => (
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
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={() => setShowPermissionsModal(false)} size="sm">
                Guardar
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
