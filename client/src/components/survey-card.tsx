import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Share2, Trash2, Check } from "lucide-react";
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
    <Card className="hover-elevate overflow-hidden transition-all duration-200 h-full">
      {/* Color Bar */}
      <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/40" />

      <div className="p-4 space-y-3">
        {/* Title & Status */}
        <div className="flex items-start justify-between gap-2 min-h-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate" data-testid={`text-survey-title-${survey.id}`}>
              {survey.title}
            </h3>
            {survey.description && (
              <p className="text-xs text-muted-foreground truncate">
                {survey.description}
              </p>
            )}
          </div>
          <Badge variant={survey.isActive ? "default" : "secondary"} className="flex-shrink-0 text-xs">
            {survey.isActive ? "Activa" : "Inactiva"}
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Preguntas:</span>
            <span className="font-bold text-base">{questionsCount}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Respuestas:</span>
            <span className="font-bold text-base">{responsesCount}</span>
          </div>
        </div>

        {/* Alert */}
        {!hasQuestions && (
          <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-500/50 rounded p-2 text-amber-700 dark:text-amber-300">
            ⚠️ Agrega preguntas para poder compartir
          </div>
        )}

        {/* ID */}
        <div className="text-xs text-muted-foreground font-mono truncate">
          {survey.id.slice(0, 12)}...
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(survey.id)}
            className="flex-1"
            data-testid={`button-edit-survey-${survey.id}`}
          >
            <Edit className="w-3 h-3 mr-1" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShare(survey.id)}
            disabled={!hasQuestions}
            className="w-10"
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
            variant="ghost"
            onClick={() => onDelete(survey.id)}
            disabled={isDeleting}
            className="w-10"
            data-testid={`button-delete-survey-${survey.id}`}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
