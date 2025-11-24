import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Shield } from "lucide-react";
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
}

export default function RolesCreatorPage() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: "admin",
      name: "Admin",
      color: "bg-blue-500",
      permissions: Object.fromEntries(MODULES.map(m => [m, ["read", "create", "edit", "delete"]]))
    },
    {
      id: "member",
      name: "Miembro",
      color: "bg-green-500",
      permissions: Object.fromEntries(MODULES.map(m => [m, ["read", "create", "edit"]]))
    },
    {
      id: "viewer",
      name: "Visualizador",
      color: "bg-gray-500",
      permissions: Object.fromEntries(MODULES.map(m => [m, ["read"]]))
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const { toast } = useToast();

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast({ title: "Error", description: "El nombre del rol es requerido", variant: "destructive" });
      return;
    }

    const newRole: Role = {
      id: Date.now().toString(),
      name: newRoleName,
      color: "bg-purple-500",
      permissions: Object.fromEntries(MODULES.map(m => [m, ["read"]]))
    };

    setRoles([...roles, newRole]);
    setNewRoleName("");
    setShowCreateModal(false);
    toast({ title: "Rol creado exitosamente" });
  };

  const handleDeleteRole = (roleId: string) => {
    if (["admin", "member", "viewer"].includes(roleId)) {
      toast({ title: "Error", description: "No puedes eliminar roles predefinidos", variant: "destructive" });
      return;
    }
    setRoles(roles.filter(r => r.id !== roleId));
    toast({ title: "Rol eliminado" });
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
      <div className="border-b border-border bg-gradient-to-b from-background/80 to-background sticky top-0 z-10 flex-shrink-0 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Creador de Roles</h1>
                <p className="text-xs text-muted-foreground">Crea y gestiona roles personalizados con permisos granulares</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Crear Rol
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="hover-elevate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRole(role);
                        setShowPermissionsModal(true);
                      }}
                      className="h-8 w-8"
                      data-testid={`button-edit-role-${role.id}`}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                    </Button>
                    {!["admin", "member", "viewer"].includes(role.id) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteRole(role.id)}
                        className="h-8 w-8"
                        data-testid={`button-delete-role-${role.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge className={`${role.color} text-white`}>{role.name}</Badge>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Rol</DialogTitle>
            <DialogDescription className="text-xs">
              Crea un nuevo rol personalizado para tu equipo
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

      {selectedRole && (
        <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Permisos de {selectedRole.name}</DialogTitle>
              <DialogDescription className="text-xs">
                Configura los permisos para cada módulo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
    </div>
  );
}
