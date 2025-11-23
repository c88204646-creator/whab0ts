import { AlertTriangle } from "lucide-react";

export default function ConversationsPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Módulo en desarrollo</h1>
        <p className="text-muted-foreground">El módulo de conversaciones se está actualizando.</p>
      </div>
    </div>
  );
}
