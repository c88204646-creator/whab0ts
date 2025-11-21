import type { Message } from "@shared/schema";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isOutgoing = message.direction === "outgoing";
  const time = new Date(message.timestamp).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex mb-4 ${isOutgoing ? "justify-end" : "justify-start"}`}
      data-testid={`message-${message.id}`}
    >
      <div
        className={`max-w-md px-4 py-2 rounded-2xl ${
          isOutgoing
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className={`text-xs ${isOutgoing ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {time}
          </span>
          {isOutgoing && (
            <span className="text-xs text-primary-foreground/70">
              {message.status === "read" ? "✓✓" : message.status === "delivered" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
