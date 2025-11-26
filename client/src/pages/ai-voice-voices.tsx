import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Music, Play, Pause, Download, Loader2, Volume2 } from "lucide-react";

export default function AIVoiceVoicesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [downloadingVoiceId, setDownloadingVoiceId] = useState<string | null>(null);
  const audioRef = useState<HTMLAudioElement | null>(null)[1];

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

  const handleDownloadVoice = async (voice: any) => {
    try {
      setDownloadingVoiceId(voice.voice_id);
      const response = await fetch(`/api/ai-voice/voices/${voice.voice_id}/audio`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Error descargando voz");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${voice.name.replace(/\s+/g, "_")}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Descargado",
        description: `Voz "${voice.name}" descargada correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al descargar la voz",
        variant: "destructive",
      });
    } finally {
      setDownloadingVoiceId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Voces Disponibles</h1>
        <p className="text-secondary-foreground mt-1">
          Explora y descarga voces de ElevenLabs para usar en tus agentes de IA
        </p>
      </div>

      <div className="flex gap-2">
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
                  <Volume2 className="w-4 h-4 text-violet-600" />
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

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 flex-1"
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
                      Preview
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 flex-1"
                  onClick={() => handleDownloadVoice(voice)}
                  disabled={downloadingVoiceId === voice.voice_id}
                  data-testid={`button-download-${voice.voice_id}`}
                >
                  {downloadingVoiceId === voice.voice_id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      Descargar
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
