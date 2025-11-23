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
import { Users, Plus, Search, Trash2, X, Edit2, Phone, Building2, Eye, Mail } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Lead } from "@shared/schema";

export default function CRMLeadsPage() {
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
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("new");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [currencySearch, setCurrencySearch] = useState("");

  const { toast } = useToast();

  const currencies = [
    { code: "MXN", name: "Peso Mexicano" },
    { code: "USD", name: "Dólar Estadounidense" },
    { code: "ARS", name: "Peso Argentino" },
    { code: "EUR", name: "Euro" },
    { code: "COP", name: "Peso Colombiano" },
    { code: "CLP", name: "Peso Chileno" },
    { code: "PEN", name: "Sol Peruano" },
    { code: "BRL", name: "Real Brasileño" },
    { code: "VES", name: "Bolívar Venezolano" },
    { code: "UYU", name: "Peso Uruguayo" },
    { code: "PYG", name: "Guaraní Paraguayo" },
    { code: "BOB", name: "Boliviano" },
  ];

  const filteredCurrencies = currencies.filter(c => 
    c.code.toLowerCase().includes(currencySearch.toLowerCase()) ||
    c.name.toLowerCase().includes(currencySearch.toLowerCase())
  );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", "userId", userId],
    enabled: !!userId,
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creando lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", "userId", userId] });
      resetForm();
      toast({ title: "Lead creado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error actualizando lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", "userId", userId] });
      resetForm();
      setShowDetails(null);
      toast({ title: "Lead actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error eliminando lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", "userId", userId] });
      toast({ title: "Lead eliminado" });
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
    setSource("");
    setNotes("");
    setStatus("new");
    setValue("");
    setCurrency("USD");
    setCurrencySearch("");
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
      source: source || undefined,
      notes: notes || undefined,
      status,
      value: value ? parseInt(value) * 100 : undefined,
      currency,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (lead: Lead) => {
    setFirstName(lead.firstName);
    setLastName(lead.lastName);
    setEmail(lead.email || "");
    setPhone(lead.phone || "");
    setCompany(lead.company || "");
    setSource(lead.source || "");
    setNotes(lead.notes || "");
    setStatus(lead.status);
    setValue(lead.value ? (lead.value / 100).toString() : "");
    setCurrency((lead as any).currency || "USD");
    setCurrencySearch("");
    setEditingId(lead.id);
    setShowForm(true);
  };

  // Filter and sort leads
  let filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  filteredLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === "name") {
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    } else if (sortBy === "company") {
      return (a.company || "").localeCompare(b.company || "");
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "new":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
      case "contacted":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "qualified":
        return "bg-green-500/20 text-green-600 dark:text-green-400";
      case "lost":
        return "bg-red-500/20 text-red-600 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "new":
        return "Nuevo";
      case "contacted":
        return "Contactado";
      case "qualified":
        return "Cualificado";
      case "lost":
        return "Perdido";
      default:
        return s;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">Leads</h1>
                  <p className="text-xs text-muted-foreground">Pipeline de oportunidades</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              data-testid="button-add-lead"
              size="sm"
              className="gap-2 h-9"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Lead</span>
            </Button>
          </div>

          {/* Alert Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
            <p className="text-sm font-semibold text-foreground">Organiza y gestiona tus leads de forma efectiva</p>
            <p className="text-xs text-foreground/70 mt-0.5">Registra, segmenta y realiza seguimiento de todas tus oportunidades de ventas</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-3">
                <p className="text-xs text-blue-600 dark:text-blue-400">Nuevos</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-3">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Contactados</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.contacted}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-3">
                <p className="text-xs text-green-600 dark:text-green-400">Cualificados</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.qualified}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, teléfono o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-leads"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="new">Nuevos</SelectItem>
                <SelectItem value="contacted">Contactados</SelectItem>
                <SelectItem value="qualified">Cualificados</SelectItem>
                <SelectItem value="lost">Perdidos</SelectItem>
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

          {filteredLeads.length === 0 ? (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium text-foreground">No hay leads</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery || filterStatus !== "all" ? "Ajusta tu búsqueda o filtros" : "Crea tu primer lead para comenzar"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Lead</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Teléfono</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Origen</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, idx) => (
                    <tr
                      key={lead.id}
                      onClick={() => setShowDetails(lead.id)}
                      className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                        idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                      data-testid={`row-lead-${lead.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {lead.firstName} {lead.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground truncate">
                          {lead.company || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground truncate">
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                              {lead.email}
                            </a>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">
                          {lead.phone ? (
                            <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                              {lead.phone}
                            </a>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground truncate">
                          {lead.source || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(lead.status)}`}>
                          {statusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(lead.id)}
                            data-testid={`button-view-lead-${lead.id}`}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(lead)}
                            data-testid={`button-edit-lead-${lead.id}`}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(lead.id)}
                            data-testid={`button-delete-lead-${lead.id}`}
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

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 sticky top-0 bg-background border-b">
              <CardTitle>{editingId ? "Editar Lead" : "Nuevo Lead"}</CardTitle>
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
                      <SelectItem value="new">Nuevo</SelectItem>
                      <SelectItem value="contacted">Contactado</SelectItem>
                      <SelectItem value="qualified">Cualificado</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="source" className="text-xs font-semibold mb-1 block">Origen</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger id="source" data-testid="select-source">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Sitio Web</SelectItem>
                      <SelectItem value="referral">Referencia</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency" className="text-xs font-semibold mb-1 block">Divisa</Label>
                  <Select value={currency} onValueChange={(val) => { setCurrency(val); setCurrencySearch(""); }}>
                    <SelectTrigger id="currency" data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          placeholder="Buscar divisa..."
                          value={currencySearch}
                          onChange={(e) => setCurrencySearch(e.target.value)}
                          className="text-xs h-8 mb-2"
                          data-testid="input-currency-search"
                        />
                      </div>
                      {filteredCurrencies.map(c => (
                        <SelectItem key={c.code} value={c.code} data-testid={`currency-${c.code}`}>
                          {c.code} - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="value" className="text-xs font-semibold mb-1 block">Valor ({currency})</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="1000"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    data-testid="input-value"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-xs font-semibold mb-1 block">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas adicionales sobre el lead..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="input-notes"
                  rows={3}
                />
              </div>

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

      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          {leads.find((l) => l.id === showDetails) && (
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              {(() => {
                const lead = leads.find((l) => l.id === showDetails)!;
                const initials = `${lead.firstName.charAt(0)}${lead.lastName.charAt(0)}`.toUpperCase();
                
                return (
                  <>
                    <div className="border-b border-border sticky top-0 bg-background">
                      <div className="px-4 py-3 flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary-foreground">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-foreground truncate">
                              {lead.firstName} {lead.lastName}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(lead.status)}`}>
                                {statusLabel(lead.status)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(lead.createdAt).toLocaleDateString("es-ES")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowDetails(null)}
                          className="h-7 w-7 p-0 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {lead.company && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-foreground">{lead.company}</span>
                        </div>
                      )}

                      {lead.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                          <a href={`mailto:${lead.email}`} className="text-xs text-primary hover:underline break-all">
                            {lead.email}
                          </a>
                        </div>
                      )}
                      
                      {lead.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                          <a href={`tel:${lead.phone}`} className="text-xs text-primary hover:underline">
                            {lead.phone}
                          </a>
                        </div>
                      )}

                      {(lead.source || lead.value) && (
                        <div className="pt-2 space-y-2 border-t border-border">
                          {lead.source && (
                            <div className="text-xs">
                              <p className="text-muted-foreground">Origen: <span className="text-foreground font-medium">{lead.source}</span></p>
                            </div>
                          )}
                          {lead.value && (
                            <div className="text-xs">
                              <p className="text-muted-foreground">Valor: <span className="text-foreground font-medium">${(lead.value / 100).toFixed(2)}</span></p>
                            </div>
                          )}
                        </div>
                      )}

                      {lead.notes && (
                        <div className="text-xs p-3 bg-muted/30 rounded border border-dashed border-border">
                          <p className="text-foreground whitespace-pre-wrap">
                            {lead.notes}
                          </p>
                        </div>
                      )}

                      <div className="border-t border-border pt-3 flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowDetails(null);
                            handleEdit(lead);
                          }}
                          className="h-8 w-8 p-0 hover:bg-muted/50"
                          data-testid={`button-edit-details-${lead.id}`}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`¿Eliminar a ${lead.firstName} ${lead.lastName}?`)) {
                              deleteMutation.mutate(lead.id);
                              setShowDetails(null);
                            }
                          }}
                          className="h-8 w-8 p-0 hover:bg-destructive/10"
                          data-testid={`button-delete-details-${lead.id}`}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
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
