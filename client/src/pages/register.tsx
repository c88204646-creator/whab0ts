import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, User, Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterPageProps {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
  onSwitchToLogin: () => void;
}

export default function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      await onRegister(data.name, data.email, data.password);
    } catch (error: any) {
      toast({
        title: "Error al registrar",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "Chat integrado en tiempo real",
    "Chatbots automáticos ilimitados",
    "Base de datos de clientes",
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-slate-50 dark:to-slate-900/50 p-4">
      <div className="w-full max-w-2xl">
        {/* Logo y titulo */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Únete a WhatsApp CRM
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Comienza a gestionar tus chatbots ahora
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna de beneficios */}
          <div className="lg:col-span-1 space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                Beneficios
              </h3>
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{benefit}</p>
                </div>
              ))}
            </div>

            {/* Tarjeta de información */}
            <Card className="border-0 bg-primary/5 mt-6">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Acceso inmediato a todas las funciones. Sin tarjeta de crédito requerida.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <CardContent className="pt-8 space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-foreground">
                            Nombre Completo
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                              <Input
                                {...field}
                                placeholder="Juan García"
                                disabled={isLoading}
                                data-testid="input-name"
                                className="pl-10 h-11 border border-input bg-background/50 hover:bg-background/80 transition-colors"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-foreground">
                            Email
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="tu@email.com"
                                disabled={isLoading}
                                data-testid="input-email"
                                className="pl-10 h-11 border border-input bg-background/50 hover:bg-background/80 transition-colors"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-semibold text-foreground">
                              Contraseña
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="••••••••"
                                  disabled={isLoading}
                                  data-testid="input-password"
                                  className="pl-10 h-11 border border-input bg-background/50 hover:bg-background/80 transition-colors"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="text-sm font-semibold text-foreground">
                              Confirmar
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="••••••••"
                                  disabled={isLoading}
                                  data-testid="input-confirm-password"
                                  className="pl-10 h-11 border border-input bg-background/50 hover:bg-background/80 transition-colors"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      disabled={isLoading}
                      data-testid="button-register"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creando cuenta...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Crear Cuenta Gratis
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>

                {/* Divider */}
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium">ya tienes cuenta</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Link a login */}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="w-full h-10 px-4 rounded-lg border border-border hover:border-primary/30 text-foreground font-semibold text-sm transition-colors hover:bg-accent"
                  data-testid="link-login"
                >
                  Inicia Sesión
                </button>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  Al crear tu cuenta aceptas nuestros{" "}
                  <button className="underline hover:text-foreground transition-colors">
                    Términos de Servicio
                  </button>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
