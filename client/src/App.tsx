import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, AlertCircle, Lock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TeamMemberData {
  name: string;
  email: string;
  role: string;
  teamName: string;
}

export default function PublicTeamMemberPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<TeamMemberData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadMemberData = async () => {
      try {
        const response = await fetch(`/api/team-members/public/${token}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("El enlace de acceso no es válido o ha sido eliminado");
          } else {
            setError("No se pudo cargar los datos del miembro");
          }
          return;
        }
        const data = await response.json();
        setMember(data);
        
        // Auto-login the member
        localStorage.setItem("user", JSON.stringify({
          id: data.userId,
          name: data.name,
          email: data.email,
          role: data.role,
          teamInfo: {
            teamId: data.teamId,
            teamName: data.teamName,
            memberId: data.memberId,
          },
          moduleAccess: data.moduleAccess,
        }));
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } catch (err) {
        setError("Error al cargar los datos del miembro");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadMemberData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-muted-foreground">Cargando datos del acceso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Acceso No Válido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              onClick={() => window.location.href = "/login"}
              className="w-full"
              variant="outline"
            >
              Volver al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-green-500/20 bg-green-500/5">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-500/20 p-3 border border-green-500/30">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-xl">¡Acceso Concedido!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-500/30 bg-green-500/10">
            <Lock className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Ingresaste como miembro autorizado del equipo
            </AlertDescription>
          </Alert>

          {member && (
            <div className="space-y-3 rounded-lg bg-card/50 p-3 border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="font-semibold text-foreground">{member.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm text-foreground">{member.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rol</p>
                <p className="font-semibold text-primary capitalize">{member.role}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Equipo</p>
                <p className="text-sm text-foreground">{member.teamName}</p>
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <p className="text-xs text-muted-foreground mb-3">
              Redirigiendo al dashboard en 2 segundos...
            </p>
            <Button
              onClick={() => window.location.href = "/"}
              className="w-full"
              data-testid="button-go-to-dashboard"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Ir al Dashboard Ahora
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
