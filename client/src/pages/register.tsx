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
import { MessageCircle, User, Mail, Lock, ArrowRight, CheckCircle, X } from "lucide-react";
import { NotificationCenter } from "@/components/notification-center";

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
  onRegister: (userData: { id: string; name: string; email: string }) => void;
  onSwitchToLogin: () => void;
}

export default function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error al registrar",
          description: error.error || "No se pudo crear la cuenta",
          variant: "destructive",
        });
        return;
      }

      const user = await response.json();
      // Transform to match the User interface exactly
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email
      };
      onRegister(userData);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -right-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl"></div>
      </div>

      <NotificationCenter />
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo y titulo */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Crear Cuenta
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              Comienza tu prueba gratuita ahora
            </p>
          </div>
        </div>

        <Card className="border border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-900 rounded-2xl">
          <CardContent className="pt-8 space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Nombre Completo
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input
                                {...field}
                                placeholder="Juan García"
                                disabled={isLoading}
                                data-testid="input-name"
                                className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Email
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="tu@email.com"
                                disabled={isLoading}
                                data-testid="input-email"
                                className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                            <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Contraseña
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="••••••••"
                                  disabled={isLoading}
                                  data-testid="input-password"
                                  className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                            <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Confirmar
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                  {...field}
                                  type="password"
                                  placeholder="••••••••"
                                  disabled={isLoading}
                                  data-testid="input-confirm-password"
                                  className="pl-10 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full h-12 text-base font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">¿Ya tienes cuenta?</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* Link a login */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                  onClick={onSwitchToLogin}
                  data-testid="link-login"
                >
                  Inicia Sesión
                </Button>

                <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                  Al crear tu cuenta aceptas nuestros{" "}
                  <button 
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                    data-testid="button-terms-register"
                  >
                    Términos de Servicio
                  </button>
                </p>
            </CardContent>
          </Card>

          {/* Terms Modal */}
            {showTerms && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl relative">
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      onClick={() => setShowTerms(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      data-testid="button-close-terms-register"
                      title="Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <CardContent className="max-h-[85vh] overflow-y-auto pt-4">
                    <div className="space-y-4 pr-2">
                      <div className="pr-4">
                        <h2 className="text-lg font-semibold text-foreground mb-1">Términos y Condiciones</h2>
                        <p className="text-xs text-muted-foreground">Última actualización: Nov 2025</p>
                      </div>

                      <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">1. Aceptación de Términos</h3>
                          <p>Al acceder y utilizar WhatsApp CRM, usted acepta cumplir con estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, favor absténgase de usar nuestro servicio.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">2. Descripción del Servicio</h3>
                          <p>WhatsApp CRM es una plataforma de gestión de relaciones con clientes (CRM) que permite a los usuarios automatizar conversaciones, crear chatbots, gestionar encuestas y administrar citas mediante integración con WhatsApp. El servicio se proporciona "tal cual" sin garantías explícitas o implícitas.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">3. Registro de Cuenta</h3>
                          <p>Al registrarse, usted declara que tiene al menos 18 años de edad y que toda la información proporcionada es precisa, completa y veraz. Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y es responsable de todas las actividades que ocurran bajo su cuenta.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">4. Licencia de Uso</h3>
                          <p>Le otorgamos una licencia limitada, no exclusiva, no transferible y revocable para usar WhatsApp CRM únicamente para fines comerciales legales y en cumplimiento con estos términos. No puede modificar, copiar, distribuir, transmitir, mostrar, ejecutar, reproducir, publicar, otorgar licencias, crear trabajos derivados o vender ningún contenido o información obtenida del servicio.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">5. Cumplimiento Legal</h3>
                          <p>Usted se compromete a utilizar WhatsApp CRM de manera legal y conforme a todas las leyes aplicables. Usted es responsable de obtener todos los consentimientos necesarios de los contactos antes de comunicarse con ellos a través de nuestra plataforma. El incumplimiento puede resultar en la suspensión o terminación de su cuenta.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">6. Protección de Datos y Privacidad</h3>
                          <p>Nos comprometemos a proteger sus datos personales de acuerdo con las regulaciones de privacidad aplicables. Los datos se almacenan con encriptación estándar de la industria. No vendemos ni compartimos datos personales con terceros sin consentimiento explícito, excepto cuando lo requiere la ley.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">7. Propiedad Intelectual</h3>
                          <p>Todos los derechos de autor, marcas registradas y otros derechos de propiedad intelectual relacionados con WhatsApp CRM son propiedad de la empresa. No se le otorga ningún derecho sobre estos elementos más allá del derecho de usar la plataforma según estos términos.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">8. Limitación de Responsabilidad</h3>
                          <p>En la máxima medida permitida por la ley, nuestra empresa no será responsable por daños indirectos, incidentales, especiales, consecuentes o punitivos derivados del uso o la imposibilidad de usar WhatsApp CRM, incluso si hemos sido advertidos de la posibilidad de tales daños.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">9. Disponibilidad del Servicio</h3>
                          <p>Aunque nos esforzamos por mantener el servicio disponible 24/7, no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimiento o actualizaciones que pueden afectar temporalmente el acceso al servicio sin previo aviso.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">10. Cancelación y Terminación</h3>
                          <p>Podemos cancelar o suspender su acceso en cualquier momento por violación de estos términos. Usted puede solicitar la cancelación de su cuenta en cualquier momento. Los datos se retendrán conforme a nuestras políticas de retención y requisitos legales.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">11. Cambios en los Términos</h3>
                          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios significativos serán notificados por correo electrónico. El uso continuado del servicio constituye aceptación de los términos modificados.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">12. Ley Aplicable</h3>
                          <p>Estos términos se rigen por la ley aplicable de la jurisdicción donde se presta el servicio. Cualquier disputa será resuelta en los tribunales competentes de esa jurisdicción.</p>
                        </section>

                        <section className="space-y-2">
                          <h3 className="font-semibold text-foreground">13. Contacto</h3>
                          <p>Para consultas sobre estos términos o el servicio, contáctenos a través de nuestro formulario de contacto. Nos comprometemos a responder todas las consultas dentro de 48 horas hábiles.</p>
                        </section>
                      </div>

                      <div className="flex gap-2 pt-3 mt-4 border-t border-border/20">
                        <Button
                          onClick={() => setShowTerms(false)}
                          className="w-full h-8 text-xs"
                          data-testid="button-accept-terms-register"
                        >
                          Aceptar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
      </div>
    </div>
  );
}
