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
    <Card className="hover-elevate overflow-hidden transition-all h-full flex flex-col border border-border/50" data-testid={`card-survey-${survey.id}`}>
      <div className="bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-3">
        <h3 className="text-sm font-bold text-foreground truncate" data-testid={`text-survey-title-${survey.id}`}>
          {survey.title}
        </h3>
        {survey.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 opacity-70">
            {survey.description}
          </p>
        )}
        {!hasQuestions && (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs mt-2 w-fit inline-block">
            Sin preguntas
          </Badge>
        )}
      </div>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-2 gap-0 border-t border-border/30 bg-muted/5">
          <div className="px-3 py-2 flex items-center gap-2 border-r border-border/30">
            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Preguntas</p>
              <p className="text-base font-bold text-primary leading-none">{questionsCount}</p>
            </div>
          </div>
          <div className="px-3 py-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Respuestas</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400 leading-none">{responsesCount}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <div className="px-2.5 py-2 flex gap-1.5 border-t border-border/30 bg-muted/5">
        <Button
          size="sm"
          onClick={() => onEdit(survey.id)}
          className="flex-1 text-sm h-9"
          data-testid={`button-edit-survey-${survey.id}`}
        >
          <Eye className="w-4 h-4 mr-1.5" />
          Ver
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onShare(survey.id)}
          disabled={!hasQuestions}
          className="h-9 w-9 p-0 flex-shrink-0"
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
          className="h-9 w-9 p-0 flex-shrink-0"
          data-testid={`button-delete-survey-${survey.id}`}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
