import { Badge } from "@/components/ui/badge";

type Status = "connected" | "disconnected" | "pending";

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    connected: {
      label: "Conectado",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      dotColor: "bg-emerald-500"
    },
    disconnected: {
      label: "Desconectado",
      className: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
      dotColor: "bg-gray-400"
    },
    pending: {
      label: "Pendiente",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      dotColor: "bg-amber-500"
    },
  };

  const variant = variants[status];

  return (
    <Badge 
      variant="secondary" 
      className={`rounded-full px-3 py-1 text-xs font-medium ${variant.className}`}
      data-testid={`badge-status-${status}`}
    >
      <span className={`w-2 h-2 rounded-full mr-2 ${variant.dotColor}`} />
      {variant.label}
    </Badge>
  );
}
