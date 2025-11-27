import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
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

interface ClientFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  editingClient?: Client | null;
  onSuccess?: () => void;
}

export function ClientFormDialog({ 
  isOpen, 
  onClose, 
  userId,
  editingClient,
  onSuccess,
}: ClientFormDialogProps) {
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
  const { toast } = useToast();

  useEffect(() => {
    if (editingClient) {
      setFirstName(editingClient.firstName);
      setLastName(editingClient.lastName);
      setEmail(editingClient.email || "");
      setCompany(editingClient.company || "");
      setAddress(editingClient.address || "");
      setCity(editingClient.city || "");
      setPostalCode(editingClient.postalCode || "");
      setCountry(editingClient.country || "");
      setNotes(editingClient.notes || "");
      setStatus(editingClient.status);
      setCurrency((editingClient as any).currency || "USD");
    } else {
      resetForm();
    }
  }, [editingClient, isOpen]);

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
    if (!/^\d+$/.test(cleanNumber)) return null;
    
    const countryFormat = COUNTRY_CODES[cleanCode];
    if (!countryFormat) return null;
    
    const expectedLocalDigits = countryFormat.localDigits;
    const prefix = countryFormat.prefix;
    
    if (prefix && cleanNumber.length === expectedLocalDigits - prefix.length) {
      cleanNumber = prefix + cleanNumber;
    }
    
    if (cleanNumber.length < 8 || cleanNumber.length !== expectedLocalDigits) {
      return null;
    }
    
    return `${cleanCode}${cleanNumber}`;
  };

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
      resetForm();
      onClose();
      toast({ title: "Cliente creado exitosamente" });
      onSuccess?.();
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
      onClose();
      toast({ title: "Cliente actualizado" });
      onSuccess?.();
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

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 sticky top-0 bg-background border-b">
          <CardTitle>{editingClient ? "Editar Cliente" : "Nuevo Cliente"}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
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
              <Label className="text-xs font-semibold mb-1 block">WhatsApp</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={whatsappCode} onValueChange={setWhatsappCode}>
                  <SelectTrigger data-testid="select-whatsapp-code">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COUNTRY_CODES).map(([code, format]) => (
                      <SelectItem key={code} value={code}>{format.name}</SelectItem>
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

          <div>
            <Label htmlFor="currency" className="text-xs font-semibold mb-1 block">Moneda</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" data-testid="select-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button 
              onClick={handleSubmit} 
              data-testid="button-submit-client"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingClient ? "Actualizar" : "Crear"} Cliente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
