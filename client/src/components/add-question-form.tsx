import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ChevronDown, Trash2 } from "lucide-react";
import { QuestionTypeSelector } from "@/components/question-type-selector";
import { QuestionPreview } from "@/components/question-preview";

interface AddQuestionFormProps {
  onAdd: (question: string, type: string, isRequired: boolean, options?: string[]) => void;
  isLoading?: boolean;
  totalQuestions?: number;
}

export function AddQuestionForm({ onAdd, isLoading, totalQuestions = 0 }: AddQuestionFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [type, setType] = useState("text");
  const [isRequired, setIsRequired] = useState(true);
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  const typesWithOptions = ["select", "checkbox", "radio"];
  const showOptions = typesWithOptions.includes(type);

  const handleAddOption = () => {
    if (optionInput.trim() && options.length < 10) {
      setOptions([...options, optionInput.trim()]);
      setOptionInput("");
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (!question.trim()) return;
    if (showOptions && options.length === 0) {
      alert(`Debes agregar al menos una opción para ${type}`);
      return;
    }
    onAdd(question, type, isRequired, showOptions ? options : undefined);
    handleReset();
  };

  const handleReset = () => {
    setQuestion("");
    setType("text");
    setIsRequired(true);
    setOptions([]);
    setOptionInput("");
    setIsExpanded(false);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-primary/10 transition-colors py-2.5 px-4"
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
        <CardContent className="space-y-3 border-t border-primary/10 pt-3 pb-3 px-4">
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

          {/* Options for select/checkbox/radio */}
          {showOptions && (
            <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border/50">
              <Label className="text-xs font-semibold">Opciones</Label>
              <div className="space-y-2">
                {options.length > 0 && (
                  <div className="space-y-1.5">
                    {options.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 bg-background/60 rounded border border-border/50"
                      >
                        <span className="text-xs text-foreground">{idx + 1}. {opt}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => handleRemoveOption(idx)}
                          data-testid={`button-remove-option-${idx}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Ej: Opción 1"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddOption()}
                    data-testid="input-add-option"
                    className="text-xs h-8"
                    disabled={options.length >= 10}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddOption}
                    disabled={!optionInput.trim() || options.length >= 10}
                    className="px-2"
                    data-testid="button-add-option"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {options.length === 10 && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">Máximo 10 opciones</p>
                )}
                {options.length > 0 && (
                  <p className="text-xs text-muted-foreground">{options.length} opción{options.length !== 1 ? 'es' : ''} agregada{options.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          )}

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
              options={showOptions ? options : undefined}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5 pt-2">
            <Button
              onClick={handleAdd}
              disabled={!question.trim() || (showOptions && options.length === 0) || isLoading}
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
