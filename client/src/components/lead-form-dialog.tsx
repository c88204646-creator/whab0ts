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
import type { Lead } from "@shared/schema";

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

interface LeadFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  editingLead?: Lead | null;
  onSuccess?: () => void;
}

export function LeadFormDialog({ 
  isOpen, 
  onClose, 
  userId,
  editingLead,
  onSuccess,
}: LeadFormDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappCode, setWhatsappCode] = useState("52");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappValidation, setWhatsappValidation] = useState<string | null>(null);
  const [company, setCompany] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("new");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const { toast } = useToast();

  useEffect(() => {
    if (editingLead) {
      setFirstName(editingLead.firstName);
      setLastName(editingLead.lastName);
      setEmail(editingLead.email || "");
      setCompany(editingLead.company || "");
      setSource(editingLead.source || "");
      setNotes(editingLead.notes || "");
      setStatus(editingLead.status);
      setValue(editingLead.value ? (editingLead.value / 100).toString() : "");
      setCurrency((editingLead as any).currency || "USD");
    } else {
      resetForm();
    }
  }, [editingLead, isOpen]);

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
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error creando lead");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", userId] });
      resetForm();
      onClose();
      toast({ title: "Lead creado exitosamente" });
      onSuccess?.();
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
      queryClient.invalidateQueries({ queryKey: ["/api/leads", userId] });
      resetForm();
      onClose();
      toast({ title: "Lead actualizado" });
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
    setSource("");
    setNotes("");
    setStatus("new");
    setValue("");
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
      source: source || undefined,
      notes: notes || undefined,
      status,
      value: value ? parseInt(value) * 100 : undefined,
      currency,
    };

    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 sticky top-0 bg-background border-b">
          <CardTitle>{editingLead ? "Editar Lead" : "Nuevo Lead"}</CardTitle>
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
              <Input
                id="source"
                placeholder="Web, Referencia, etc..."
                value={source}
                onChange={(e) => setSource(e.target.value)}
                data-testid="input-source"
              />
            </div>
            <div>
              <Label htmlFor="value" className="text-xs font-semibold mb-1 block">Valor Estimado</Label>
              <Input
                id="value"
                placeholder="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                data-testid="input-value"
                type="number"
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
              data-testid="button-submit-lead"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingLead ? "Actualizar" : "Crear"} Lead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
