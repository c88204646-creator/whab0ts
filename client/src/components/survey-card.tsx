import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit, Share2, Trash2, Check, BarChart3, HelpCircle, AlertCircle } from "lucide-react";
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
    <Card className="hover-elevate overflow-hidden transition-all duration-200 h-full flex flex-col">
      {/* Header Background */}
      <div className="h-1 bg-gradient-to-r from-primary/80 to-primary/40" />

      <CardHeader className="space-y-2 pb-2 px-3 pt-3">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate" data-testid={`text-survey-title-${survey.id}`}>
              {survey.title}
            </h3>
            {survey.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {survey.description}
              </p>
            )}
          </div>
          <Badge variant={survey.isActive ? "default" : "secondary"} className="flex-shrink-0 text-xs py-0 px-2">
            {survey.isActive ? "Activa" : "Inactiva"}
          </Badge>
        </div>

        {/* Alert if no questions */}
        {!hasQuestions && (
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 py-1 px-2 mt-1">
            <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-300 text-xs ml-0.5">
              Agrega preguntas
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      {/* Stats */}
      <CardContent className="flex-1 space-y-2 px-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-muted/50 rounded border border-border/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Preguntas</span>
            </p>
            <p className="text-lg font-bold mt-0.5">{questionsCount}</p>
          </div>
          <div className="p-2 bg-muted/50 rounded border border-border/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span>Respuestas</span>
            </p>
            <p className="text-lg font-bold mt-0.5">{responsesCount}</p>
          </div>
        </div>

        {/* Survey ID */}
        <div className="text-xs text-muted-foreground">
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs block truncate font-mono">
            {survey.id.slice(0, 12)}...
          </code>
        </div>
      </CardContent>

      {/* Actions */}
      <div className="border-t border-border/50 p-2 bg-muted/30">
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(survey.id)}
            className="flex-1 h-8 text-xs"
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
            className="h-8"
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
            variant="ghost"
            onClick={() => onDelete(survey.id)}
            disabled={isDeleting}
            className="h-8"
            data-testid={`button-delete-survey-${survey.id}`}
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
