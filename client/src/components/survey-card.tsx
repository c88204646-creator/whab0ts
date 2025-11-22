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
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate" data-testid={`text-survey-title-${survey.id}`}>
            {survey.title}
          </h3>
          {survey.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {survey.description}
            </p>
          )}
        </div>
        {!hasQuestions && (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs mt-2 w-fit">
            Sin preguntas
          </Badge>
        )}
      </div>

      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-0 border-t border-border/30">
          <div className="px-3 py-2 flex items-center gap-2 border-r border-border/30">
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Preguntas</p>
              <p className="text-base font-bold text-primary">{questionsCount}</p>
            </div>
          </div>
          <div className="px-3 py-2 flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Respuestas</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">{responsesCount}</p>
            </div>
          </div>
        </div>

        {/* Questions Preview */}
        {hasQuestions && (
          <div className="border-t border-border/30 flex-1 flex flex-col">
            <div className="max-h-20 overflow-y-auto flex-1">
              <div className="space-y-0.5 p-2">
                {(survey.questions || []).slice(0, 5).map((q: any, idx: number) => (
                  <div key={q.id} className="text-xs text-muted-foreground line-clamp-1 px-2 py-1 hover:bg-muted/20 rounded">
                    <span className="font-semibold text-primary/70">P{idx + 1}.</span> {q.question}
                  </div>
                ))}
                {(survey.questions || []).length > 5 && (
                  <div className="text-xs text-muted-foreground px-2 py-1 text-center">
                    +{(survey.questions || []).length - 5} más
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Action Buttons */}
      <div className="px-2 py-2 flex gap-1 border-t border-border/30">
        <Button
          size="sm"
          onClick={() => onEdit(survey.id)}
          className="flex-1 text-xs h-7"
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
          className="h-7 w-7 p-0"
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
          className="h-7 w-7 p-0"
          data-testid={`button-delete-survey-${survey.id}`}
        >
          <Trash2 className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
