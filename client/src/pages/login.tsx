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
import { Mail, Lock, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email requerido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onLogin: (userData: { id: string; name: string; email: string; role?: string; teamInfo?: any; moduleAccess?: any }) => void;
  onSwitchToRegister: () => void;
}

export default function LoginPage({ onLogin, onSwitchToRegister }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error al iniciar sesión",
          description: error.error || "Credenciales inválidas",
          variant: "destructive",
        });
        return;
      }

      const user = await response.json();
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "owner",
        teamInfo: user.teamInfo,
        moduleAccess: user.moduleAccess
      };
      onLogin(userData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Bienvenido
          </h1>
          <p className="text-muted-foreground">
            Accede a tu cuenta de WhatsApp CRM
          </p>
        </div>

        <Card className="border border-border">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="tu@email.com"
                            disabled={isLoading}
                            data-testid="input-email"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            disabled={isLoading}
                            data-testid="input-password"
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-6"
                  data-testid="button-login"
                >
                  {isLoading ? "Iniciando sesión..." : (
                    <span className="flex items-center gap-2">
                      Iniciar Sesión
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground mb-4">
                ¿No tienes cuenta?
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onSwitchToRegister}
                data-testid="link-register"
              >
                Crear Cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
