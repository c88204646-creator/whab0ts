import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, GripVertical, ChevronDown, Edit2 } from "lucide-react";
import { QuestionPreview } from "@/components/question-preview";
import type { SurveyQuestion } from "@shared/schema";

interface QuestionCardProps {
  question: SurveyQuestion;
  number: number;
  onDelete: (id: string) => void;
  onEdit?: (question: SurveyQuestion) => void;
  onDuplicate?: (question: SurveyQuestion) => void;
  isDeletingId?: string;
}

const TYPE_LABELS: Record<string, { label: string; variant: any }> = {
  text: { label: "Texto Corto", variant: "outline" },
  textarea: { label: "Texto Largo", variant: "outline" },
  date: { label: "Fecha", variant: "secondary" },
  number: { label: "Número", variant: "secondary" },
  select: { label: "Selector", variant: "secondary" },
  checkbox: { label: "Casillas", variant: "secondary" },
  radio: { label: "Radio", variant: "secondary" },
  email: { label: "Email", variant: "outline" },
};

export function QuestionCard({
  question,
  number,
  onDelete,
  onEdit,
  onDuplicate,
  isDeletingId,
}: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeInfo = TYPE_LABELS[question.type] || { label: question.type, variant: "outline" };

  return (
    <Card className="hover-elevate overflow-hidden transition-all duration-200 border-l-4 border-l-primary/30 rounded-md">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0">
            <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Question title and expand button */}
            <div className="flex items-start justify-between gap-1 mb-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs leading-tight">
                  <span className="text-muted-foreground font-normal mr-1 bg-muted px-1.5 py-0.5 rounded text-xs">
                    #{number}
                  </span>
                  <span className="break-words">{question.question}</span>
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-shrink-0 h-5 w-5 p-0 -mr-1"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>

            {/* Badges and Actions in same row */}
            <div className="flex gap-0.5 flex-wrap items-center">
              <Badge variant={typeInfo.variant as any} className="text-2xs py-0.5 px-1.5 h-4 text-xs">
                {typeInfo.label}
              </Badge>
              {question.isRequired && (
                <Badge variant="destructive" className="text-2xs py-0.5 px-1.5 h-4 text-xs">
                  Oblig.
                </Badge>
              )}
              {(question.options || []).length > 0 && (
                <Badge variant="outline" className="text-2xs py-0.5 px-1.5 h-4 text-xs">
                  {(question.options || []).length} op
                </Badge>
              )}
              
              {/* Quick Actions - Icon only buttons */}
              <div className="ml-auto flex gap-0.5 items-center">
                {onDuplicate && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDuplicate(question)}
                    data-testid={`button-duplicate-question-${question.id}`}
                    className="h-5 w-5"
                    title="Duplicar"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                )}
                {onEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(question)}
                    data-testid={`button-edit-question-${question.id}`}
                    className="h-5 w-5"
                    title="Editar"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(question.id)}
                  disabled={isDeletingId === question.id}
                  data-testid={`button-delete-question-${question.id}`}
                  className="h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Eliminar"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Preview */}
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-border/50 space-y-2 animate-in fade-in duration-200">
            <QuestionPreview
              question={question.question}
              type={question.type}
              isRequired={question.isRequired}
              number={number}
              options={question.options as string[] || []}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
