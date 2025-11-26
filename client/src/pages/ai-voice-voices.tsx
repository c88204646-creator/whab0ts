import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Music, Play, Pause, Loader2, Volume2 } from "lucide-react";

const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: any }) => (
  <div className="px-4 py-3 bg-muted/30 rounded-lg border border-border/50">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
  </div>
);

export default function AIVoiceVoicesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const { data: voices = [], isLoading } = useQuery({
    queryKey: ["/api/ai-voice/voices-with-audio"],
  });

  const filteredVoices = useMemo(() => {
    return voices.filter((voice: any) =>
      voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voice.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [voices, searchTerm]);

  const handlePlayPreview = async (voice: any) => {
    try {
      if (playingVoiceId === voice.voice_id) {
        setPlayingVoiceId(null);
        return;
      }

      if (!voice.preview_url) {
        toast({
          title: "Sin preview",
          description: "Esta voz no tiene preview disponible",
          variant: "destructive",
        });
        return;
      }

      setPlayingVoiceId(voice.voice_id);
      const audio = new Audio(voice.preview_url);
      audio.onended = () => setPlayingVoiceId(null);
      audio.play().catch(() => {
        toast({
          title: "Error",
          description: "No se pudo reproducir el audio",
          variant: "destructive",
        });
        setPlayingVoiceId(null);
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al reproducir preview",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="flex flex-col bg-background">
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Top - Title and Buttons */}
          <div className="flex items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                <Music className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Voces Disponibles</h1>
                <p className="text-xs text-muted-foreground/80">Explora y escucha las voces de ElevenLabs disponibles para tus agentes</p>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          {!isLoading && voices.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <StatCard label="Total de Voces" value={voices.length} icon={Music} />
              <StatCard label="Voces Filtradas" value={filteredVoices.length} icon={Volume2} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Buscar voces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
              data-testid="input-search-voices"
            />
          </div>

          {isLoading ? (
            <Card className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Cargando voces...</p>
            </Card>
          ) : filteredVoices.length === 0 ? (
            <Card className="p-12 text-center">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No hay voces disponibles</h3>
              <p className="text-secondary-foreground">
                {searchTerm ? "Intenta con otro término de búsqueda" : "Cargando catálogo de voces..."}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVoices.map((voice: any) => (
                <Card
                  key={voice.voice_id}
                  className="p-4 space-y-3 hover:shadow-md transition-shadow flex flex-col"
                  data-testid={`card-voice-${voice.voice_id}`}
                >
                  {/* Nombre y descripción */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-red-600" />
                      {voice.name}
                    </h3>
                    <p className="text-sm text-secondary-foreground line-clamp-2 mt-1">
                      {voice.description || "Sin descripción"}
                    </p>
                  </div>

                  {/* Características */}
                  <div className="bg-muted/50 p-2 rounded text-sm space-y-1">
                    {voice.accent && (
                      <p>
                        <span className="font-medium">Acento:</span> {voice.accent}
                      </p>
                    )}
                    {voice.age && (
                      <p>
                        <span className="font-medium">Edad:</span> {voice.age}
                      </p>
                    )}
                    {voice.gender && (
                      <p>
                        <span className="font-medium">Género:</span> {voice.gender}
                      </p>
                    )}
                    {voice.use_case && (
                      <p>
                        <span className="font-medium">Uso:</span> {voice.use_case}
                      </p>
                    )}
                  </div>

                  {/* Acción de Preview */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 w-full"
                    onClick={() => handlePlayPreview(voice)}
                    disabled={playingVoiceId !== null && playingVoiceId !== voice.voice_id}
                    data-testid={`button-play-${voice.voice_id}`}
                  >
                    {playingVoiceId === voice.voice_id ? (
                      <>
                        <Pause className="w-3 h-3" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        Escuchar Preview
                      </>
                    )}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
