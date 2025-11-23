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
  onRegister: (name: string, email: string, password: string) => Promise<void>;
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-slate-50 dark:to-slate-900/50 p-4">
      <NotificationCenter />
      <div className="w-full max-w-md">
        {/* Logo y titulo */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-lg">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Crear Cuenta
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Comienza tu prueba gratuita ahora
            </p>
          </div>
        </div>

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
                              <Input autoComplete="off"
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
                              <Input autoComplete="off"
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
                                <Input autoComplete="off"
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
                                <Input autoComplete="off"
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
                  <button 
                    onClick={() => setShowTerms(true)}
                    className="underline hover:text-foreground transition-colors"
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
