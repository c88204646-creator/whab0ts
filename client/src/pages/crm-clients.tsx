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
import { Users, Plus, Search, Trash2, X, Edit2, Mail, Phone, Building2, MapPin } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { Client } from "@shared/schema";

export default function CRMClientsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const filteredClients = clients.filter((client) =>
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="p-6">Cargando clientes...</div>;

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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Clientes</h1>
              <p className="text-sm text-muted-foreground">{clients.length} cliente{clients.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            data-testid="button-add-client"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-clients"
              />
            </div>
          </div>

          {/* Clients Grid */}
          {filteredClients.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay clientes aún</p>
                <p className="text-sm text-muted-foreground mt-2">Crea tu primer cliente para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {client.firstName} {client.lastName}
                        </h3>
                        {client.company && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="w-3 h-3" />
                            {client.company}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(client.status)}`}>
                        {statusLabel(client.status)}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4 text-xs text-muted-foreground">
                      {client.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </p>
                      )}
                      {client.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </p>
                      )}
                      {(client.address || client.city) && (
                        <p className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 mt-0.5" />
                          <span>
                            {client.address}
                            {client.address && client.city && ", "}
                            {client.city}
                          </span>
                        </p>
                      )}
                    </div>

                    {client.notes && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 p-2 bg-muted/30 rounded">
                        {client.notes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(client)}
                        data-testid={`button-edit-client-${client.id}`}
                        className="flex-1"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(client.id)}
                        data-testid={`button-delete-client-${client.id}`}
                        className="flex-1"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
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
            <CardContent className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    placeholder="Juan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido *</Label>
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
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="phone">Teléfono</Label>
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
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    placeholder="Acme Corp"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    data-testid="input-company"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
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
                <Label htmlFor="address">Dirección</Label>
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
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Madrid"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    data-testid="input-city"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Código Postal</Label>
                  <Input
                    id="postalCode"
                    placeholder="28001"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    data-testid="input-postal-code"
                  />
                </div>
                <div>
                  <Label htmlFor="country">País</Label>
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
                <Label htmlFor="notes">Notas</Label>
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
              <div className="flex gap-2 pt-2">
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
    </div>
  );
}
