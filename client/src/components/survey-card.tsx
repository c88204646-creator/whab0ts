import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Share2, Trash2, Check } from "lucide-react";
import type { Survey } from "@shared/schema";

interface SurveyCardProps {
  survey: Survey;
  questionsCount: number;
  responsesCount: number;
  copiedId?: string | null;
  isDeletingId?: string | null;
  onEdit: (id: string) => void;
  onShare: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SurveyCard({
  survey,
  questionsCount,
  responsesCount,
  copiedId,
  isDeletingId,
  onEdit,
  onShare,
  onDelete,
}: SurveyCardProps) {
  const hasQuestions = questionsCount > 0;
  const isDeleting = isDeletingId === survey.id;

  return (
    <Card className="hover-elevate overflow-hidden transition-all duration-200 h-full flex flex-col border border-border/60 bg-gradient-to-br from-background to-muted/20">
      <div className="p-5 space-y-4 flex flex-col h-full">
        {/* Title & Status */}
        <div className="flex items-start justify-between gap-3 min-h-12">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold truncate text-foreground" data-testid={`text-survey-title-${survey.id}`}>
              {survey.title}
            </h3>
            {survey.description && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {survey.description}
              </p>
            )}
          </div>
          <Badge variant={survey.isActive ? "default" : "secondary"} className="flex-shrink-0 text-xs font-semibold">
            {survey.isActive ? "Activa" : "Inactiva"}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-border/40">
            <p className="text-xs text-muted-foreground font-medium mb-1">Preguntas</p>
            <p className="text-2xl font-bold text-primary">{questionsCount}</p>
          </div>
          <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-border/40">
            <p className="text-xs text-muted-foreground font-medium mb-1">Respuestas</p>
            <p className="text-2xl font-bold text-primary">{responsesCount}</p>
          </div>
        </div>

        {/* Alert */}
        {!hasQuestions && (
          <div className="text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-500/40 rounded-lg p-3 text-amber-700 dark:text-amber-300 flex gap-2">
            <span>⚠️</span>
            <span className="font-medium">Agrega preguntas para compartir</span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* ID */}
        <div className="text-xs text-muted-foreground font-mono bg-muted/40 p-2 rounded border border-border/30">
          ID: {survey.id.slice(0, 12)}...
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/30">
          <Button
            size="sm"
            variant="default"
            onClick={() => onEdit(survey.id)}
            className="flex-1 h-9"
            data-testid={`button-edit-survey-${survey.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShare(survey.id)}
            disabled={!hasQuestions}
            className="h-9 w-10 p-0"
            data-testid={`button-share-survey-${survey.id}`}
          >
            {copiedId === survey.id ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(survey.id)}
            disabled={isDeleting}
            className="h-9 w-10 p-0"
            data-testid={`button-delete-survey-${survey.id}`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
