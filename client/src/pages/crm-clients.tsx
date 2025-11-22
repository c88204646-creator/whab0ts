import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Trash2, X, Edit2, Mail, Phone, Building2, MapPin, Eye, Filter } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

export default function CRMClientsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "company" | "recent">("recent");

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("active");

  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: [`/api/clients/${userId}`],
    enabled: !!userId,
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creando cliente");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${userId}`] });
      resetForm();
      toast({ title: "Cliente creado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error actualizando cliente");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${userId}`] });
      resetForm();
      setShowDetails(null);
      toast({ title: "Cliente actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando cliente");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${userId}`] });
      toast({ title: "Cliente eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setAddress("");
    setCity("");
    setPostalCode("");
    setCountry("");
    setNotes("");
    setStatus("active");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({ title: "Error", description: "Nombre y apellido son obligatorios", variant: "destructive" });
      return;
    }

    const data = {
      userId,
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      address: address || undefined,
      city: city || undefined,
      postalCode: postalCode || undefined,
      country: country || undefined,
      notes: notes || undefined,
      status,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client: Client) => {
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setCompany(client.company || "");
    setAddress(client.address || "");
    setCity(client.city || "");
    setPostalCode(client.postalCode || "");
    setCountry(client.country || "");
    setNotes(client.notes || "");
    setStatus(client.status);
    setEditingId(client.id);
    setShowForm(true);
  };

  // Filter and sort clients
  let filteredClients = clients.filter((client) => {
    const matchesSearch =
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort
  filteredClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "name") {
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    } else if (sortBy === "company") {
      return (a.company || "").localeCompare(b.company || "");
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Stats
  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    inactive: clients.filter((c) => c.status === "inactive").length,
    potential: clients.filter((c) => c.status === "potential").length,
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "active":
        return "bg-green-500/20 text-green-600 dark:text-green-400";
      case "inactive":
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400";
      case "potential":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "active":
        return "Activo";
      case "inactive":
        return "Inactivo";
      case "potential":
        return "Potencial";
      default:
        return s;
    }
  };

  if (isLoading) return <div className="p-6">Cargando clientes...</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">CRM - Clientes</h1>
                <p className="text-xs text-muted-foreground">Gestiona tu cartera de clientes profesionalmente</p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              data-testid="button-add-client"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Cliente
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-3">
                <p className="text-xs text-green-600 dark:text-green-400">Activos</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-3">
                <p className="text-xs text-blue-600 dark:text-blue-400">Potenciales</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.potential}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-500/10 border-gray-500/20">
              <CardContent className="p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">Inactivos</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.inactive}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          {/* Search and Filters */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, teléfono o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-clients"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="potential">Potenciales</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-40" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="name">Por nombre</SelectItem>
                <SelectItem value="company">Por empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredClients.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay clientes</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery || filterStatus !== "all" ? "Ajusta tu búsqueda o filtros" : "Crea tu primer cliente para comenzar"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Teléfono</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Ciudad</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client, idx) => (
                    <tr
                      key={client.id}
                      className={`border-b border-border hover:bg-muted/50 transition-colors ${
                        idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                      data-testid={`row-client-${client.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium">
                          {client.firstName} {client.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground truncate">
                          {client.company || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground truncate">
                          {client.email ? (
                            <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                              {client.email}
                            </a>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">
                          {client.phone ? (
                            <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                              {client.phone}
                            </a>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">
                          {client.city || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(client.status)}`}>
                          {statusLabel(client.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(client.id)}
                            data-testid={`button-view-client-${client.id}`}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            data-testid={`button-edit-client-${client.id}`}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(client.id)}
                            data-testid={`button-delete-client-${client.id}`}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 sticky top-0 bg-background border-b">
              <CardTitle>{editingId ? "Editar Cliente" : "Nuevo Cliente"}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetForm}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-xs font-semibold mb-1 block">Nombre *</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-xs font-semibold mb-1 block">Apellido *</Label>
                  <Input
                    id="lastName"
                    placeholder="García"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email" className="text-xs font-semibold mb-1 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold mb-1 block">Teléfono</Label>
                  <Input
                    id="phone"
                    placeholder="+34 600 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    data-testid="input-phone"
                  />
                </div>
              </div>

              {/* Company & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="company" className="text-xs font-semibold mb-1 block">Empresa</Label>
                  <Input
                    id="company"
                    placeholder="Acme Corp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    data-testid="input-company"
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-xs font-semibold mb-1 block">Estado</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="potential">Potencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Fields */}
              <div>
                <Label htmlFor="address" className="text-xs font-semibold mb-1 block">Dirección</Label>
                <Input
                  id="address"
                  placeholder="Calle Principal 123"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  data-testid="input-address"
                />
              </div>

              {/* City, Postal, Country */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="city" className="text-xs font-semibold mb-1 block">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Madrid"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    data-testid="input-city"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode" className="text-xs font-semibold mb-1 block">Código Postal</Label>
                  <Input
                    id="postalCode"
                    placeholder="28001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    data-testid="input-postal-code"
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="text-xs font-semibold mb-1 block">País</Label>
                  <Input
                    id="country"
                    placeholder="España"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    data-testid="input-country"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-xs font-semibold mb-1 block">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre el cliente..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="input-notes"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending || !firstName.trim() || !lastName.trim()}
                  className="flex-1"
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Details Modal - Professional CRM */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          {clients.find((c) => c.id === showDetails) && (
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {(() => {
                const client = clients.find((c) => c.id === showDetails)!;
                const initials = `${client.firstName.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
                
                return (
                  <>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border sticky top-0">
                      <div className="px-6 py-4 flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary-foreground">{initials}</span>
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold text-foreground">
                              {client.firstName} {client.lastName}
                            </h2>
                            {client.company && (
                              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <Building2 className="w-4 h-4" />
                                {client.company}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor(client.status)}`}>
                                {statusLabel(client.status)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Creado {new Date(client.createdAt).toLocaleDateString("es-ES")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowDetails(null)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                      {/* Contact Information */}
                      {(client.email || client.phone) && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3">Información de Contacto</h3>
                          <div className="space-y-2">
                            {client.email && (
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                                <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline break-all">
                                  {client.email}
                                </a>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                                <a href={`tel:${client.phone}`} className="text-sm text-primary hover:underline">
                                  {client.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Address Information */}
                      {(client.address || client.city || client.country) && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3">Ubicación</h3>
                          <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <div className="flex gap-3">
                              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <div className="text-sm space-y-1">
                                {client.address && (
                                  <p className="text-foreground font-medium">{client.address}</p>
                                )}
                                {(client.city || client.postalCode || client.country) && (
                                  <p className="text-muted-foreground">
                                    {[client.city, client.postalCode, client.country].filter(Boolean).join(", ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {client.notes && (
                        <div>
                          <h3 className="text-sm font-semibold text-foreground mb-3">Notas</h3>
                          <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                              {client.notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="border-t border-border pt-6 flex gap-3">
                        <Button
                          onClick={() => {
                            setShowDetails(null);
                            handleEdit(client);
                          }}
                          className="flex-1 h-10"
                          data-testid={`button-edit-details-${client.id}`}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar Cliente
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (client.email) {
                              window.location.href = `mailto:${client.email}`;
                            }
                          }}
                          disabled={!client.email}
                          className="flex-1 h-10"
                          data-testid={`button-email-${client.id}`}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Enviar Email
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            if (confirm(`¿Eliminar a ${client.firstName} ${client.lastName}?`)) {
                              deleteMutation.mutate(client.id);
                              setShowDetails(null);
                            }
                          }}
                          className="h-10 w-10 p-0"
                          data-testid={`button-delete-details-${client.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
