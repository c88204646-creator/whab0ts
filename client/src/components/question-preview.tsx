import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface QuestionPreviewProps {
  question: string;
  type: string;
  isRequired: boolean;
  number?: number;
  options?: string[];
}

export function QuestionPreview({ question, type, isRequired, number, options = [] }: QuestionPreviewProps) {
  if (!question.trim()) {
    return (
      <div className="p-4 bg-muted/30 rounded-md border-2 border-dashed text-muted-foreground text-sm">
        Escribe una pregunta para ver la preview
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/10 rounded-md border border-border">
      <Label className="font-semibold block mb-3">
        {number}. {question}
        {isRequired && <span className="text-destructive">*</span>}
      </Label>

      {type === "text" && (
        <Input
          placeholder="Respuesta..."
          disabled
          data-testid="preview-input-text"
          className="bg-white dark:bg-slate-950"
        />
      )}

      {type === "textarea" && (
        <Textarea
          placeholder="Respuesta..."
          disabled
          rows={4}
          data-testid="preview-input-textarea"
          className="bg-white dark:bg-slate-950"
        />
      )}

      {type === "date" && (
        <Input
          type="date"
          disabled
          data-testid="preview-input-date"
          className="bg-white dark:bg-slate-950"
        />
      )}

      {type === "number" && (
        <Input
          type="number"
          placeholder="Número..."
          disabled
          data-testid="preview-input-number"
          className="bg-white dark:bg-slate-950"
        />
      )}

      {type === "select" && (
        <select
          disabled
          data-testid="preview-input-select"
          className="w-full px-3 py-2 border border-input rounded-md bg-white dark:bg-slate-950 text-sm"
        >
          <option value="">Selecciona una opción...</option>
          {options.length > 0 ? (
            options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))
          ) : (
            <option value="1" disabled>(Agrega opciones)</option>
          )}
        </select>
      )}

      {type === "radio" && (
        <div className="space-y-2" data-testid="preview-input-radio">
          {options.length > 0 ? (
            options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  disabled
                  name={`preview-radio-${number}`}
                  className="w-4 h-4"
                />
                <span className="text-sm">{opt}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">(Agrega opciones)</div>
          )}
        </div>
      )}

      {type === "checkbox" && (
        <div className="space-y-2" data-testid="preview-input-checkbox">
          {options.length > 0 ? (
            options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled
                  className="w-4 h-4"
                />
                <span className="text-sm">{opt}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">(Agrega opciones)</div>
          )}
        </div>
      )}
    </div>
  );
}
