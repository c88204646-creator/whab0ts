import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Music, Play, Pause, Loader2, Volume2, Search } from "lucide-react";

// Avatar SVG components for voices
const VoiceAvatars: Record<string, () => JSX.Element> = {
  default: () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="50" r="50" fill="currentColor" opacity="0.1" />
      <circle cx="50" cy="35" r="12" fill="currentColor" />
      <path d="M 35 50 Q 35 60 50 60 Q 65 60 65 50" fill="currentColor" />
    </svg>
  ),
  professional: () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <rect x="10" y="10" width="80" height="80" rx="8" fill="currentColor" opacity="0.1" />
      <circle cx="50" cy="35" r="12" fill="currentColor" />
      <rect x="35" y="50" width="30" height="35" rx="4" fill="currentColor" />
    </svg>
  ),
  young: () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="50" r="50" fill="currentColor" opacity="0.1" />
      <circle cx="40" cy="35" r="10" fill="currentColor" />
      <circle cx="60" cy="35" r="10" fill="currentColor" />
      <path d="M 35 55 Q 50 65 65 55" fill="currentColor" />
    </svg>
  ),
  old: () => (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      <circle cx="50" cy="50" r="50" fill="currentColor" opacity="0.1" />
      <circle cx="50" cy="35" r="13" fill="currentColor" />
      <path d="M 30 55 Q 50 70 70 55" fill="currentColor" />
      <circle cx="35" cy="30" r="3" fill="currentColor" />
      <circle cx="65" cy="30" r="3" fill="currentColor" />
    </svg>
  ),
};

// Get avatar based on voice characteristics
const getVoiceAvatar = (voice: any) => {
  if (voice.age === "old") return VoiceAvatars.old;
  if (voice.age === "young") return VoiceAvatars.young;
  if (voice.use_case?.includes("professional")) return VoiceAvatars.professional;
  return VoiceAvatars.default;
};

// Get language flag
const getLanguageFlag = (voice: any) => {
  const accent = voice.accent?.toLowerCase() || "";
  if (accent.includes("spanish") || accent.includes("latino")) return "🇪🇸";
  if (accent.includes("english") || accent.includes("american") || accent.includes("british")) return "🇬🇧";
  if (accent.includes("british")) return "🇬🇧";
  if (accent.includes("american")) return "🇺🇸";
  if (accent.includes("indian")) return "🇮🇳";
  if (accent.includes("german")) return "🇩🇪";
  if (accent.includes("french")) return "🇫🇷";
  if (accent.includes("italian")) return "🇮🇹";
  if (accent.includes("portuguese") || accent.includes("brazilian")) return "🇧🇷";
  return "🌍";
};

// Get language text
const getLanguageText = (voice: any) => {
  const accent = voice.accent?.toLowerCase() || "";
  if (accent.includes("spanish") || accent.includes("latino")) return "Español";
  if (accent.includes("english") || accent.includes("american") || accent.includes("british")) return "English";
  if (accent.includes("portuguese") || accent.includes("brazilian")) return "Português";
  if (accent.includes("german")) return "Deutsch";
  if (accent.includes("french")) return "Français";
  if (accent.includes("italian")) return "Italiano";
  return "Multi";
};

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
              <div className="w-10 h-10 rounded-lg bg-muted/40 flex items-center justify-center flex-shrink-0 border border-border/50">
                <Music className="w-5 h-5 text-foreground" />
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
          {/* Search Bar */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar voces por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-border/50"
                data-testid="input-search-voices"
              />
            </div>
          </div>

          {isLoading ? (
            <Card className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Cargando voces disponibles...</p>
            </Card>
          ) : filteredVoices.length === 0 ? (
            <Card className="p-12 bg-muted/20 border border-border/50">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-muted/40 border border-border/50 flex items-center justify-center mx-auto mb-4">
                  <Music className="w-8 h-8 text-foreground/60" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No hay voces disponibles</h3>
                <p className="text-secondary-foreground text-sm">
                  {searchTerm ? "Intenta con otro término de búsqueda" : "Cargando catálogo de voces..."}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVoices.map((voice: any) => {
                const Avatar = getVoiceAvatar(voice);
                const languageFlag = getLanguageFlag(voice);
                const languageText = getLanguageText(voice);
                
                return (
                  <div
                    key={voice.voice_id}
                    className="group overflow-hidden border border-border/50 rounded-lg hover-elevate transition-all"
                    data-testid={`card-voice-${voice.voice_id}`}
                  >
                    {/* Card Header con Avatar */}
                    <div className="bg-gradient-to-r from-muted/50 via-muted/30 to-transparent p-4 pb-3 border-b border-border/50">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center text-foreground">
                          <Avatar />
                        </div>
                        
                        {/* Name and Language */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-foreground line-clamp-1">{voice.name}</h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-lg">{languageFlag}</span>
                            <span className="text-xs font-medium text-muted-foreground">{languageText}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-2.5">{voice.description || "Sin descripción"}</p>
                    </div>

                    {/* Card Body - Características */}
                    <div className="p-4 space-y-2.5">
                      {/* Género */}
                      {voice.gender && (
                        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md border border-border/30 transition-colors">
                          <span className="text-sm">👤</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground">Género</p>
                            <p className="text-sm font-semibold text-foreground capitalize">{voice.gender}</p>
                          </div>
                        </div>
                      )}

                      {/* Edad */}
                      {voice.age && (
                        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md border border-border/30 transition-colors">
                          <span className="text-sm">📅</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground">Edad</p>
                            <p className="text-sm font-semibold text-foreground capitalize">{voice.age}</p>
                          </div>
                        </div>
                      )}

                      {/* Caso de Uso */}
                      {voice.use_case && (
                        <div className="flex items-center gap-2 p-2 bg-muted/20 rounded-md border border-border/30 transition-colors">
                          <span className="text-sm">🎯</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground">Caso de Uso</p>
                            <p className="text-sm font-semibold text-foreground line-clamp-1">{voice.use_case}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer - Preview Button */}
                    <div className="px-4 py-3 bg-muted/20 border-t border-border/30">
                      <Button
                        size="sm"
                        variant={playingVoiceId === voice.voice_id ? "default" : "outline"}
                        className="w-full gap-2 h-9"
                        onClick={() => handlePlayPreview(voice)}
                        disabled={playingVoiceId !== null && playingVoiceId !== voice.voice_id}
                        data-testid={`button-play-${voice.voice_id}`}
                      >
                        {playingVoiceId === voice.voice_id ? (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            <span>Escuchar Preview</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
