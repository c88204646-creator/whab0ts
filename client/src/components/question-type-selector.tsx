import { Type, Square, Calendar, Hash, ListChecks, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuestionType {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const QUESTION_TYPES: QuestionType[] = [
  {
    value: "text",
    label: "Texto Corto",
    description: "Respuesta de una línea",
    icon: <Type className="w-5 h-5" />,
  },
  {
    value: "textarea",
    label: "Texto Largo",
    description: "Respuesta de varias líneas",
    icon: <Square className="w-5 h-5" />,
  },
  {
    value: "date",
    label: "Fecha",
    description: "Seleccionar una fecha",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    value: "number",
    label: "Número",
    description: "Respuesta numérica",
    icon: <Hash className="w-5 h-5" />,
  },
  {
    value: "select",
    label: "Selector",
    description: "Seleccionar una opción",
    icon: <ListChecks className="w-5 h-5" />,
  },
  {
    value: "checkbox",
    label: "Casillas",
    description: "Seleccionar múltiples opciones",
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

interface QuestionTypeSelectorProps {
  value: string;
  onSelect: (type: string) => void;
}

export function QuestionTypeSelector({ value, onSelect }: QuestionTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-2">
      {QUESTION_TYPES.map((type) => {
        const isSelected = value === type.value;
        return (
          <Button
            key={type.value}
            variant={isSelected ? "default" : "outline"}
            className="h-auto flex flex-col items-start p-3 gap-1 hover-elevate transition-all"
            onClick={() => onSelect(type.value)}
            data-testid={`button-type-${type.value}`}
          >
            <div className="flex items-center gap-2 w-full">
              {type.icon}
              <span className="font-semibold text-sm leading-tight">{type.label}</span>
            </div>
            <span className={`text-xs text-left leading-tight ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {type.description}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
