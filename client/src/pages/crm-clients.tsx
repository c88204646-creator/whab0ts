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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Trash2, X, Edit2, Mail, Phone, Building2, MapPin, Eye, Filter, Globe, MapPinIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/loading-spinner";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import type { Client } from "@shared/schema";

interface CountryFormat {
  code: string;
  name: string;
  localDigits: number;
  prefix?: string;
}

const COUNTRY_CODES: Record<string, CountryFormat> = {
  "52": { code: "52", name: "México 🇲🇽", localDigits: 11, prefix: "1" },
  "1": { code: "1", name: "USA/Canadá 🇺🇸", localDigits: 10 },
  "34": { code: "34", name: "España 🇪🇸", localDigits: 9 },
  "55": { code: "55", name: "Brasil 🇧🇷", localDigits: 11 },
  "54": { code: "54", name: "Argentina 🇦🇷", localDigits: 10 },
  "57": { code: "57", name: "Colombia 🇨🇴", localDigits: 10 },
  "56": { code: "56", name: "Chile 🇨🇱", localDigits: 9 },
  "51": { code: "51", name: "Perú 🇵🇪", localDigits: 9 },
  "58": { code: "58", name: "Venezuela 🇻🇪", localDigits: 10 },
  "502": { code: "502", name: "Guatemala 🇬🇹", localDigits: 8 },
  "503": { code: "503", name: "El Salvador 🇸🇻", localDigits: 8 },
  "504": { code: "504", name: "Honduras 🇭🇳", localDigits: 8 },
  "505": { code: "505", name: "Nicaragua 🇳🇮", localDigits: 8 },
  "506": { code: "506", name: "Costa Rica 🇨🇷", localDigits: 8 },
  "507": { code: "507", name: "Panamá 🇵🇦", localDigits: 8 },
};

export default function CRMClientsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "company" | "recent">("recent");
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("52");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappValidation, setWhatsappValidation] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("active");
  const [currency, setCurrency] = useState("USD");
  const [currencySearch, setCurrencySearch] = useState("");

  const { toast } = useToast();

  const validateWhatsAppNumber = (number: string, code: string): boolean => {
    if (!number) return false;
    const cleaned = number.trim().replace(/\s+/g, '');
    const countryFormat = COUNTRY_CODES[code];
    if (!countryFormat) return false;
    const expectedLength = countryFormat.prefix 
      ? countryFormat.localDigits - countryFormat.prefix.length 
      : countryFormat.localDigits;
    return /^\d+$/.test(cleaned) && cleaned.length === expectedLength;
  };

  const getFullWhatsAppNumber = (): string | null => {
    if (!whatsappNumber.trim()) return null;
    
    let cleanNumber = whatsappNumber
      .trim()
      .replace(/\s+/g, '')
      .replace(/[-()]/g, '')
      .replace(/[@+]/g, '')
      .replace(/\./g, '');
    
    const cleanCode = whatsappCode.trim().replace(/\D/g, '');
    
    if (!/^\d+$/.test(cleanNumber)) {
      return null;
    }
    
    const countryFormat = COUNTRY_CODES[cleanCode];
    if (!countryFormat) {
      return null;
    }
    
    const expectedLocalDigits = countryFormat.localDigits;
    const prefix = countryFormat.prefix;
    
    if (prefix && cleanNumber.length === expectedLocalDigits - prefix.length) {
      cleanNumber = prefix + cleanNumber;
    }
    
    if (cleanNumber.length < 8) {
      return null;
    }
    
    if (cleanNumber.length !== expectedLocalDigits) {
      return null;
    }
    
    return `${cleanCode}${cleanNumber}`;
  };

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

  const { data: clients = [], isLoading, refetch } = useQuery<Client[]>({
    queryKey: ["/api/clients", userId],
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
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
      queryClient.invalidateQueries({ queryKey: ["/api/clients", userId] });
      refetch();
      resetForm();
      setShowForm(false);
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
      queryClient.invalidateQueries({ queryKey: ["/api/clients", userId] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/clients", userId] });
      setClientToDelete(null);
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
    setWhatsappCode("52");
    setWhatsappNumber("");
    setWhatsappValidation(null);
    setCompany("");
    setAddress("");
    setCity("");
    setPostalCode("");
    setCountry("");
    setNotes("");
    setStatus("active");
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

    const fullWhatsApp = getFullWhatsAppNumber();
    if (!fullWhatsApp) {
      toast({
        title: "Error",
        description: "El número de WhatsApp no es válido",
        variant: "destructive",
      });
      return;
    }

    const data = {
      userId,
      firstName,
      lastName,
      email: email || undefined,
      phone: fullWhatsApp,
      company: company || undefined,
      address: address || undefined,
      city: city || undefined,
      postalCode: postalCode || undefined,
      country: country || undefined,
      notes: notes || undefined,
      status,
      currency,
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
    setWhatsappCode("52");
    setWhatsappNumber("");
    setWhatsappValidation(null);
    setCompany(client.company || "");
    setAddress(client.address || "");
    setCity(client.city || "");
    setPostalCode(client.postalCode || "");
    setCountry(client.country || "");
    setNotes(client.notes || "");
    setStatus(client.status);
    setCurrency((client as any).currency || "USD");
    setCurrencySearch("");
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

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col h-full bg-background min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-background/80 to-background">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">Clientes</h1>
                  <p className="text-xs text-muted-foreground">Cartera de clientes</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              data-testid="button-add-client"
              size="sm"
              className="gap-2 h-9"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Cliente</span>
            </Button>
          </div>

          {/* Alert Banner */}
          <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
            <Users className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Mantén organizada tu cartera de clientes</p>
              <p className="text-xs text-muted-foreground mt-0.5">Registra información completa, historial de interacciones y realiza un seguimiento efectivo</p>
            </div>
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
      <div className="flex-1 overflow-y-auto custom-scrollbar">
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
              <div className="overflow-x-hidden">
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
                      onClick={() => setShowDetails(client.id)}
                      className={`border-b border-border hover:bg-muted/50 transition-colors cursor-pointer ${
                        idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                      data-testid={`row-client-${client.id}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {client.firstName} {client.lastName}
                          </span>
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
                        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
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
                            onClick={() => setClientToDelete({ id: client.id, name: `${client.firstName} ${client.lastName}` })}
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
                  <Label className="text-xs font-semibold mb-1 block">WhatsApp</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={whatsappCode} onValueChange={setWhatsappCode}>
                      <SelectTrigger data-testid="select-whatsapp-code">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COUNTRY_CODES).map(([code, format]) => (
                          <SelectItem key={code} value={code}>
                            {format.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={whatsappNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setWhatsappNumber(value);
                        if (value) {
                          setWhatsappValidation(validateWhatsAppNumber(value, whatsappCode) ? "valid" : "invalid");
                        } else {
                          setWhatsappValidation(null);
                        }
                      }}
                      placeholder="Número"
                      className="col-span-2"
                      data-testid="input-whatsapp-number"
                    />
                  </div>
                  {whatsappValidation === "invalid" && (
                    <p className="text-xs text-destructive mt-1">Número inválido</p>
                  )}
                  {whatsappValidation === "valid" && (
                    <p className="text-xs text-green-500 mt-1">✓ Válido</p>
                  )}
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
                      <SelectItem value="potential">Potencial</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              {/* Currency Selection */}
              <div>
                <Label htmlFor="currency" className="text-xs font-semibold mb-1 block">Moneda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCurrencies.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-xs font-semibold mb-1 block">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Información adicional..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="textarea-notes"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="ghost" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSubmit} data-testid="button-submit-client">
                  {editingId ? "Actualizar" : "Crear"} Cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <Dialog open={!!showDetails} onOpenChange={() => setShowDetails(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Información del Cliente</DialogTitle>
            </DialogHeader>
            {clients.find(c => c.id === showDetails) && (
              <div className="space-y-4">
                {(() => {
                  const client = clients.find(c => c.id === showDetails);
                  if (!client) return null;
                  return (
                    <>
                      {/* Name and Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Nombre</p>
                          <p className="font-semibold text-foreground">{client.firstName} {client.lastName}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {client.status === 'active' ? '✓ Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      {/* Contact Information */}
                      {(client.email || client.phone) && (
                        <div className="space-y-2 border-t border-border/50 pt-3">
                          {client.email && (
                            <div className="flex items-start gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="text-xs font-medium break-all">{client.email}</p>
                              </div>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-start gap-2">
                              <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">WhatsApp</p>
                                <p className="text-xs font-medium">{client.phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Company and Address */}
                      {(client.company || client.address || client.city) && (
                        <div className="space-y-2 border-t border-border/50 pt-3">
                          {client.company && (
                            <div className="flex items-start gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Empresa</p>
                                <p className="text-xs font-medium">{client.company}</p>
                              </div>
                            </div>
                          )}
                          {(client.address || client.city) && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-muted-foreground">Dirección</p>
                                <p className="text-xs font-medium">
                                  {[client.address, client.city, client.postalCode, client.country].filter(Boolean).join(', ')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {client.notes && (
                        <div className="border-t border-border/50 pt-3">
                          <p className="text-xs text-muted-foreground mb-1">Notas</p>
                          <p className="text-xs text-foreground/80 bg-muted/30 p-2 rounded">{client.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-border/50">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleEdit(client);
                            setShowDetails(null);
                          }}
                          className="flex-1"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowDetails(null)}
                          className="flex-1"
                        >
                          Cerrar
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {clientToDelete && (
        <DeleteConfirmationDialog
          isOpen={!!clientToDelete}
          onClose={() => setClientToDelete(null)}
          onConfirm={() => {
            if (clientToDelete) {
              deleteMutation.mutate(clientToDelete.id);
            }
          }}
          itemName={clientToDelete.name}
          itemType="Cliente"
        />
      )}
    </div>
  );
}
