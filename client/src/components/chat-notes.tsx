import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Edit2, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ChatNote } from "@shared/schema";

interface ChatNotesProps {
  conversationId: string;
}

export function ChatNotes({ conversationId }: ChatNotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["/api/chat-notes", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/chat-notes?conversationId=${conversationId}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      return res.json() as Promise<ChatNote[]>;
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/chat-notes", { conversationId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-notes", conversationId] });
      setNewNoteContent("");
      setIsAdding(false);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      return apiRequest("PATCH", `/api/chat-notes/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-notes", conversationId] });
      setEditingId(null);
      setEditingContent("");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/chat-notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat-notes", conversationId] });
      setDeleteConfirmId(null);
    },
  });

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
    setDeletePopoverOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deleteNoteMutation.mutate(deleteConfirmId);
      setDeletePopoverOpen(false);
    }
  };

  return (
    <div className="space-y-2 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Notas del chat</h3>
        {!isAdding && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsAdding(true)}
            data-testid="button-add-note"
          >
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 p-2 bg-muted/50 rounded-md flex-shrink-0"
          >
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Nueva nota..."
              className="min-h-[50px] text-xs resize-none"
              autoFocus
            />
            <div className="flex gap-1 justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs px-2"
                onClick={() => {
                  setIsAdding(false);
                  setNewNoteContent("");
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => createNoteMutation.mutate(newNoteContent)}
                disabled={!newNoteContent.trim() || createNoteMutation.isPending}
                data-testid="button-save-note"
              >
                Guardar
              </Button>
            </div>
          </motion.div>
        )}

        <ScrollArea className="flex-1 min-h-0 max-h-40">
          <div className="pr-3">
            {isLoading ? (
              <div className="text-xs text-muted-foreground text-center py-2">Cargando...</div>
            ) : notes.length === 0 && !isAdding ? (
              <div className="text-xs text-muted-foreground text-center py-2">Sin notas</div>
            ) : (
              <AnimatePresence>
                {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-2 bg-muted/30 rounded-md border border-border/50 space-y-1.5"
            >
              {editingId === note.id ? (
                <>
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="min-h-[50px] text-xs resize-none"
                  />
                  <div className="flex gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => updateNoteMutation.mutate({ id: note.id, content: editingContent })}
                      disabled={updateNoteMutation.isPending}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Guardar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditingContent(note.content);
                        }}
                        data-testid={`button-edit-note-${note.id}`}
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </Button>
                      <Popover open={deletePopoverOpen && deleteConfirmId === note.id} onOpenChange={setDeletePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => handleDeleteClick(note.id)}
                            disabled={deleteNoteMutation.isPending}
                            data-testid={`button-delete-note-${note.id}`}
                          >
                            <Trash2 className="w-2.5 h-2.5 text-destructive" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="end">
                          <div className="space-y-1.5">
                            <p className="text-xs text-foreground">¿Eliminar nota?</p>
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs px-2"
                                onClick={() => setDeletePopoverOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                className="h-6 text-xs px-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                onClick={handleConfirmDelete}
                                disabled={deleteNoteMutation.isPending}
                              >
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
            ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>

    </div>
  );
}
