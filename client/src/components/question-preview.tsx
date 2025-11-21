import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface QuestionPreviewProps {
  question: string;
  type: string;
  isRequired: boolean;
  number?: number;
}

export function QuestionPreview({ question, type, isRequired, number }: QuestionPreviewProps) {
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
    </div>
  );
}
