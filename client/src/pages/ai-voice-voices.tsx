import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Music, Play, Pause, Loader2, Volume2, Search, User, Users, Baby, Trophy, Briefcase, Globe, Zap } from "lucide-react";

// Professional Avatar SVG components for voices
const VoiceAvatars: Record<string, () => JSX.Element> = {
  default: () => (
    <svg viewBox="0 0 100 100" className="w-8 h-8">
      <circle cx="50" cy="30" r="14" fill="currentColor" />
      <path d="M 25 60 Q 25 50 50 50 Q 75 50 75 60 L 75 85 Q 75 100 50 100 Q 25 100 25 85 Z" fill="currentColor" />
    </svg>
  ),
  male: () => (
    <svg viewBox="0 0 100 100" className="w-8 h-8">
      <circle cx="50" cy="28" r="16" fill="currentColor" />
      <path d="M 22 65 L 22 100 L 35 100 L 35 75 L 65 75 L 65 100 L 78 100 L 78 65 Q 78 50 50 50 Q 22 50 22 65 Z" fill="currentColor" />
    </svg>
  ),
  female: () => (
    <svg viewBox="0 0 100 100" className="w-8 h-8">
      <circle cx="50" cy="28" r="16" fill="currentColor" />
      <path d="M 50 50 Q 25 50 18 70 L 18 100 L 32 100 L 32 75 L 45 75 L 45 100 L 55 100 L 55 75 L 68 75 L 68 100 L 82 100 L 82 70 Q 75 50 50 50 Z" fill="currentColor" />
    </svg>
  ),
  professional: () => (
    <svg viewBox="0 0 100 100" className="w-8 h-8">
      <circle cx="50" cy="28" r="16" fill="currentColor" />
      <rect x="20" y="55" width="60" height="45" rx="4" fill="currentColor" />
      <rect x="35" y="70" width="8" height="30" fill="currentColor" opacity="0.5" />
      <rect x="57" y="70" width="8" height="30" fill="currentColor" opacity="0.5" />
    </svg>
  ),
};

// Get avatar based on voice characteristics
const getVoiceAvatar = (voice: any) => {
  if (voice.use_case?.includes("professional")) return VoiceAvatars.professional;
  if (voice.gender === "male") return VoiceAvatars.male;
  if (voice.gender === "female") return VoiceAvatars.female;
  return VoiceAvatars.default;
};

// Get language abbreviation
const getLanguageCode = (voice: any) => {
  const accent = voice.accent?.toLowerCase() || "";
  if (accent.includes("spanish") || accent.includes("latino")) return "ES";
  if (accent.includes("english") || accent.includes("american") || accent.includes("british")) return "EN";
  if (accent.includes("portuguese") || accent.includes("brazilian")) return "PT";
  if (accent.includes("german")) return "DE";
  if (accent.includes("french")) return "FR";
  if (accent.includes("italian")) return "IT";
  return "ML";
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
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground">Voces Disponibles</h1>
                <p className="text-xs text-muted-foreground/80">Explora y escucha las voces disponibles para tus agentes</p>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Total de Voces" value={voices.length} icon={Music} />
            <StatCard label="Voces Filtradas" value={filteredVoices.length} icon={Volume2} />
            <StatCard label="Idiomas Soportados" value={new Set(voices.map((v: any) => getLanguageText(v))).size} icon={Music} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredVoices.map((voice: any) => {
                const Avatar = getVoiceAvatar(voice);
                const languageCode = getLanguageCode(voice);
                const languageText = getLanguageText(voice);
                
                return (
                  <Card
                    key={voice.voice_id}
                    className="overflow-hidden hover-elevate transition-all border-border/50 flex flex-col h-full"
                    data-testid={`card-voice-${voice.voice_id}`}
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-br from-muted/40 to-muted/20 p-3 border-b border-border/30">
                      <div className="flex items-start gap-2.5">
                        {/* Avatar */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
                          <Avatar />
                        </div>
                        
                        {/* Name and Language */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xs text-foreground line-clamp-1">{voice.name}</h3>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3 text-muted-foreground/60" />
                            <span className="text-xs text-muted-foreground">{languageCode}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body - Características */}
                    <div className="p-3 space-y-1.5 flex-1">
                      {/* Género */}
                      {voice.gender && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                          <span className="text-xs text-foreground capitalize">{voice.gender}</span>
                        </div>
                      )}

                      {/* Edad */}
                      {voice.age && (
                        <div className="flex items-center gap-2">
                          {voice.age === "young" && <Baby className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />}
                          {voice.age === "old" && <Trophy className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />}
                          {!["young", "old"].includes(voice.age) && <Users className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />}
                          <span className="text-xs text-foreground capitalize">{voice.age}</span>
                        </div>
                      )}

                      {/* Caso de Uso */}
                      {voice.use_case && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                          <span className="text-xs text-foreground line-clamp-1">{voice.use_case}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer - Preview Button */}
                    <div className="px-3 py-2 bg-muted/20 border-t border-border/30">
                      <Button
                        size="sm"
                        variant={playingVoiceId === voice.voice_id ? "default" : "outline"}
                        className="w-full gap-1.5 h-8 text-xs"
                        onClick={() => handlePlayPreview(voice)}
                        disabled={playingVoiceId !== null && playingVoiceId !== voice.voice_id}
                        data-testid={`button-play-${voice.voice_id}`}
                      >
                        {playingVoiceId === voice.voice_id ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Escuchar</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
