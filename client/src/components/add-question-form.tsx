import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronDown } from "lucide-react";
import { QuestionTypeSelector } from "@/components/question-type-selector";
import { QuestionPreview } from "@/components/question-preview";

interface AddQuestionFormProps {
  onAdd: (question: string, type: string, isRequired: boolean) => void;
  isLoading?: boolean;
  totalQuestions?: number;
}

export function AddQuestionForm({ onAdd, isLoading, totalQuestions = 0 }: AddQuestionFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [type, setType] = useState("text");
  const [isRequired, setIsRequired] = useState(true);

  const handleAdd = () => {
    if (!question.trim()) return;
    onAdd(question, type, isRequired);
    setQuestion("");
    setType("text");
    setIsRequired(true);
  };

  const handleReset = () => {
    setQuestion("");
    setType("text");
    setIsRequired(true);
    setIsExpanded(false);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Agregar Nueva Pregunta</CardTitle>
              {totalQuestions > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Pregunta #{totalQuestions + 1}
                </p>
              )}
            </div>
            {totalQuestions > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {totalQuestions} pregunta{totalQuestions !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-300 text-muted-foreground ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 border-t border-primary/10 pt-4 pb-4">
          {/* Question Input */}
          <div className="space-y-1.5">
            <Label htmlFor="add-question-input" className="text-xs font-semibold">
              Tu Pregunta
            </Label>
            <Input
              id="add-question-input"
              placeholder="Ej: ¿Cuál es tu experiencia con nuestro servicio?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              data-testid="input-add-question"
              autoFocus
              className="text-sm border-primary/20 focus:border-primary h-8"
            />
          </div>

          {/* Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tipo de Respuesta</Label>
            <QuestionTypeSelector value={type} onSelect={setType} />
          </div>

          {/* Required Toggle */}
          <div className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-border/50 hover:border-border transition-colors">
            <input
              type="checkbox"
              id="add-question-required"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              data-testid="checkbox-add-required"
              className="w-3.5 h-3.5 rounded cursor-pointer accent-primary"
            />
            <label htmlFor="add-question-required" className="cursor-pointer flex-1">
              <span className="text-xs font-medium block">Pregunta obligatoria</span>
            </label>
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Preview</Label>
            <QuestionPreview
              question={question}
              type={type}
              isRequired={isRequired}
              number={totalQuestions + 1}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5 pt-2">
            <Button
              onClick={handleAdd}
              disabled={!question.trim() || isLoading}
              className="flex-1"
              size="sm"
              data-testid="button-confirm-add-question"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {isLoading ? "Agregando..." : "Agregar"}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className=""
              data-testid="button-cancel-add-question"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
