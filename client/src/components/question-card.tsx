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
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 mt-1">
            <GripVertical className="w-4 h-4 text-muted-foreground/50" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <p className="font-semibold text-sm leading-snug">
                  <span className="text-muted-foreground font-normal mr-1.5 bg-muted px-2 py-0.5 rounded text-xs">
                    #{number}
                  </span>
                  {question.question}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-shrink-0 h-6 w-6 p-0"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={typeInfo.variant as any} className="text-xs">
                {typeInfo.label}
              </Badge>
              {question.isRequired && (
                <Badge variant="destructive" className="text-xs">
                  Obligatoria
                </Badge>
              )}
              {(question.options || []).length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {(question.options || []).length} opciones
                </Badge>
              )}
            </div>

            {/* Quick Actions (visible by default) */}
            <div className="flex gap-2 mt-3">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(question)}
                  data-testid={`button-edit-question-${question.id}`}
                  className="text-xs h-7 px-2"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(question.id)}
                disabled={isDeletingId === question.id}
                data-testid={`button-delete-question-${question.id}`}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {isDeletingId === question.id ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Preview */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in fade-in duration-200">
            <QuestionPreview
              question={question.question}
              type={question.type}
              isRequired={question.isRequired}
              number={number}
              options={question.options as string[] || []}
            />

            {/* Actions */}
            <div className="flex gap-2 flex-col sm:flex-row">
              {onDuplicate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDuplicate(question)}
                  data-testid={`button-duplicate-question-${question.id}`}
                  className="flex-1 sm:flex-initial"
                >
                  <Copy className="w-3 h-3 mr-2" />
                  Duplicar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
