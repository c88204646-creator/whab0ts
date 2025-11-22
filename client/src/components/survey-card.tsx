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
      <div className="bg-gradient-to-r from-primary/15 to-primary/5 px-2 py-1.5">
        <h3 className="text-xs font-semibold text-foreground truncate" data-testid={`text-survey-title-${survey.id}`}>
          {survey.title}
        </h3>
        {survey.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 opacity-70">
            {survey.description}
          </p>
        )}
        {!hasQuestions && (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs mt-1 w-fit inline-block">
            Sin preguntas
          </Badge>
        )}
      </div>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-2 gap-0 border-t border-border/30 bg-muted/5">
          <div className="px-1.5 py-1 flex items-center gap-1 border-r border-border/30">
            <FileText className="h-3 w-3 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Preg</p>
              <p className="text-sm font-bold text-primary leading-none">{questionsCount}</p>
            </div>
          </div>
          <div className="px-1.5 py-1 flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Resp</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-none">{responsesCount}</p>
            </div>
          </div>
        </div>
      </CardContent>

      <div className="px-1 py-1 flex gap-0.5 border-t border-border/30 bg-muted/5">
        <Button
          size="sm"
          onClick={() => onEdit(survey.id)}
          className="flex-1 text-xs h-6 px-2"
          data-testid={`button-edit-survey-${survey.id}`}
        >
          <Eye className="w-2.5 h-2.5 mr-0.5" />
          Ver
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onShare(survey.id)}
          disabled={!hasQuestions}
          className="h-6 w-6 p-0 flex-shrink-0"
          data-testid={`button-share-survey-${survey.id}`}
        >
          {copiedId === survey.id ? (
            <Check className="w-2.5 h-2.5" />
          ) : (
            <Share2 className="w-2.5 h-2.5" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(survey.id)}
          disabled={isDeleting}
          className="h-6 w-6 p-0 flex-shrink-0"
          data-testid={`button-delete-survey-${survey.id}`}
        >
          <Trash2 className="w-2.5 h-2.5 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}
