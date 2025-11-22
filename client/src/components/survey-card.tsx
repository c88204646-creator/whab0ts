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
    <Card className="hover-elevate overflow-hidden transition-all h-full flex flex-col border border-border/50 bg-gradient-to-br from-background to-muted/10">
      <div className="p-3 space-y-3 flex flex-col h-full">
        {/* Compact Title */}
        <div className="min-h-10">
          <h3 className="text-sm font-semibold truncate" data-testid={`text-survey-title-${survey.id}`}>
            {survey.title}
          </h3>
          {survey.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {survey.description}
            </p>
          )}
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-muted/40 rounded border border-border/30">
            <p className="text-xs text-muted-foreground font-medium">Preguntas</p>
            <p className="text-xl font-bold text-primary">{questionsCount}</p>
          </div>
          <div className="p-2 bg-muted/40 rounded border border-border/30">
            <p className="text-xs text-muted-foreground font-medium">Respuestas</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{responsesCount}</p>
          </div>
        </div>

        {/* Alert Compact */}
        {!hasQuestions && (
          <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 rounded p-2 text-amber-700 dark:text-amber-300">
            Agrega preguntas para compartir
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions Compact */}
        <div className="flex gap-1.5 pt-2 border-t border-border/30">
          <Button
            size="sm"
            onClick={() => onEdit(survey.id)}
            className="flex-1 h-8 text-xs"
            data-testid={`button-edit-survey-${survey.id}`}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onShare(survey.id)}
            disabled={!hasQuestions}
            className="h-8 w-8 p-0"
            data-testid={`button-share-survey-${survey.id}`}
          >
            {copiedId === survey.id ? (
              <Check className="w-3 h-3" />
            ) : (
              <Share2 className="w-3 h-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(survey.id)}
            disabled={isDeleting}
            className="h-8 w-8 p-0"
            data-testid={`button-delete-survey-${survey.id}`}
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
