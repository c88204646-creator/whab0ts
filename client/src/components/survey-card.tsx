import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Share2, Trash2, Check, FileText, MessageSquare } from "lucide-react";
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
    <Card className="hover-elevate overflow-hidden transition-all h-full flex flex-col" data-testid={`card-survey-${survey.id}`}>
      {/* Header with background */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate" data-testid={`text-survey-title-${survey.id}`}>
              {survey.title}
            </h3>
            {survey.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {survey.description}
              </p>
            )}
          </div>
        </div>
        {!hasQuestions && (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs">
            Sin preguntas
          </Badge>
        )}
      </div>

      <CardContent className="p-0">
        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-0 border-t border-border/30">
          <div className="px-4 py-3 flex items-center gap-3 border-r border-border/30">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Preguntas</p>
              <p className="text-lg font-bold text-primary">{questionsCount}</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Respuestas</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{responsesCount}</p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Action Buttons */}
      <div className="px-4 py-3 flex gap-2 border-t border-border/30 mt-auto">
        <Button
          size="sm"
          onClick={() => onEdit(survey.id)}
          className="flex-1"
          data-testid={`button-edit-survey-${survey.id}`}
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onShare(survey.id)}
          disabled={!hasQuestions}
          className="flex-shrink-0"
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
          className="flex-shrink-0"
          data-testid={`button-delete-survey-${survey.id}`}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
