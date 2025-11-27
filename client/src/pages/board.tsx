import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, Trash, Pencil, StickyNote, ChevronLeft, ChevronRight, 
  Calendar, Pin, Archive, GripVertical, X, Smile, Palette
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BoardNote, InsertBoardNote } from "@shared/schema";

const NOTE_COLORS = [
  { id: "blue", hex: "#3b82f6", bg: "bg-blue-500", name: "Azul" },
  { id: "green", hex: "#22c55e", bg: "bg-green-500", name: "Verde" },
  { id: "yellow", hex: "#eab308", bg: "bg-yellow-500", name: "Amarillo" },
  { id: "orange", hex: "#f97316", bg: "bg-orange-500", name: "Naranja" },
  { id: "red", hex: "#ef4444", bg: "bg-red-500", name: "Rojo" },
  { id: "purple", hex: "#a855f7", bg: "bg-purple-500", name: "Morado" },
  { id: "pink", hex: "#ec4899", bg: "bg-pink-500", name: "Rosa" },
  { id: "cyan", hex: "#06b6d4", bg: "bg-cyan-500", name: "Cyan" },
  { id: "indigo", hex: "#6366f1", bg: "bg-indigo-500", name: "Indigo" },
  { id: "teal", hex: "#14b8a6", bg: "bg-teal-500", name: "Teal" },
];

const EMOJIS = [
  "📌", "🎯", "💡", "🔥", "⭐", "❤️", "💰", "📞", "📧", "✅",
  "⚡", "🚀", "📝", "🎉", "💬", "👤", "📊", "🔔", "⏰", "📅",
  "🏠", "💼", "🎨", "🔧", "📱", "💻", "🎵", "🌟", "🏆", "💎",
];

const DAYS_SHORT = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function BoardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState<BoardNote | null>(null);
  const [draggedNote, setDraggedNote] = useState<BoardNote | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    color: "#3b82f6",
    emoji: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
  });
  const boardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  const { data: notes = [], isLoading, refetch } = useQuery<BoardNote[]>({
    queryKey: ["/api/board-notes", userId],
    queryFn: () => userId ? fetch(`/api/board-notes/${userId}`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBoardNote) => {
      console.log("Creating note:", data);
      const response = await fetch("/api/board-notes", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data) 
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error creating note");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/board-notes", userId] });
      toast({ title: "Nota creada", description: "Tu nota ha sido agregada a la pizarra" });
      resetForm();
    },
    onError: (error: any) => {
      console.error("Error creating note:", error);
      toast({ title: "Error", description: error.message || "No se pudo crear la nota", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BoardNote> }) =>
      fetch(`/api/board-notes/${id}`, { method: "PATCH", body: JSON.stringify(updates) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/board-notes", userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/board-notes/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/board-notes", userId] });
      toast({ title: "Nota eliminada", description: "La nota ha sido eliminada" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      color: "#3b82f6",
      emoji: "",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
    });
    setShowNoteForm(false);
    setEditingNote(null);
  };

  const handleSubmit = () => {
    console.log("handleSubmit called, userId:", userId);
    
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" });
      return;
    }

    if (!userId) {
      toast({ title: "Error", description: "No se pudo identificar al usuario", variant: "destructive" });
      return;
    }

    if (editingNote) {
      updateMutation.mutate({
        id: editingNote.id,
        updates: {
          title: formData.title,
          content: formData.content,
          color: formData.color,
          emoji: formData.emoji || null,
          date: formData.date ? new Date(formData.date) : null,
        },
      });
      resetForm();
    } else {
      const dateTime = formData.date && formData.time 
        ? new Date(`${formData.date}T${formData.time}`)
        : new Date();
      
      const noteData = {
        userId: userId,
        title: formData.title,
        content: formData.content || null,
        color: formData.color,
        emoji: formData.emoji || null,
        date: dateTime,
        positionX: Math.floor(Math.random() * 300),
        positionY: Math.floor(Math.random() * 200),
        zIndex: 1,
        isPinned: false,
        isArchived: false,
        width: 200,
        height: 150,
      };
      console.log("Submitting note data:", noteData);
      createMutation.mutate(noteData as any);
    }
  };

  const handleEdit = (note: BoardNote) => {
    setEditingNote(note);
    const noteDate = note.date ? new Date(note.date) : new Date();
    const dateStr = noteDate.toISOString().split("T")[0];
    const timeStr = `${String(noteDate.getHours()).padStart(2, "0")}:${String(noteDate.getMinutes()).padStart(2, "0")}`;
    
    setFormData({
      title: note.title,
      content: note.content || "",
      color: note.color,
      emoji: note.emoji || "",
      date: dateStr,
      time: timeStr,
    });
    setShowNoteForm(true);
  };

  const handlePinToggle = (note: BoardNote) => {
    updateMutation.mutate({
      id: note.id,
      updates: { isPinned: !note.isPinned },
    });
  };

  const handleArchive = (note: BoardNote) => {
    updateMutation.mutate({
      id: note.id,
      updates: { isArchived: true },
    });
    toast({ title: "Nota archivada", description: "La nota ha sido archivada" });
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getNotesForDate = (date: Date) => {
    return notes.filter((note) => {
      if (!note.date) return false;
      const noteDate = new Date(note.date);
      return (
        noteDate.getDate() === date.getDate() &&
        noteDate.getMonth() === date.getMonth() &&
        noteDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const hasNotesOnDay = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return getNotesForDate(date).length > 0;
  };

  // Get week days for week view
  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  // Get time slots for the calendar
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

  const todayNotes = getNotesForDate(selectedDate);
  const pinnedNotes = notes.filter(n => n.isPinned);

  // Render calendar days
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const prevMonthDays = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="text-center py-1 text-muted-foreground/40 text-xs">
          {prevMonthDays - i}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const hasNotes = hasNotesOnDay(day);
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`text-center py-1 text-xs rounded-full relative hover:bg-muted transition-colors ${
            isToday(day) ? "bg-primary text-primary-foreground font-bold" : ""
          } ${isSelected(day) && !isToday(day) ? "ring-2 ring-primary" : ""}`}
          data-testid={`calendar-day-${day}`}
        >
          {day}
          {hasNotes && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
          )}
        </button>
      );
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(
        <div key={`next-${i}`} className="text-center py-1 text-muted-foreground/40 text-xs">
          {i}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-gradient-to-b from-card via-card/95 to-card/90 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 border border-primary/20">
                  <StickyNote className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">Pizarra</h1>
                  <p className="text-xs text-muted-foreground/80">Notas libres y calendario visual</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <Button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                size="icon"
                variant="ghost"
                className="hidden md:inline-flex"
                data-testid="button-toggle-sidebar"
              >
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
              <div className="flex bg-muted/30 rounded-lg p-1 gap-1">
                <Button
                  onClick={() => setViewMode("week")}
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  data-testid="view-week"
                >
                  <span className="hidden sm:inline">Semana</span>
                  <span className="sm:hidden">S</span>
                </Button>
                <Button
                  onClick={() => setViewMode("month")}
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7"
                  data-testid="view-month"
                >
                  <span className="hidden sm:inline">Mes</span>
                  <span className="sm:hidden">M</span>
                </Button>
              </div>
              <Button
                onClick={() => setShowNoteForm(true)}
                size="sm"
                className="gap-2"
                data-testid="button-add-note"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Nota</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar - Calendar & Today's Notes */}
        <div className={`hidden md:flex md:w-72 border-r border-border bg-card/50 flex flex-col overflow-hidden ${!sidebarOpen ? "md:hidden" : ""}`}>
          {/* Mini Calendar */}
          <div className="p-4 border-b border-border/50">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {MONTHS[currentDate.getMonth()]} <span className="text-muted-foreground">{currentDate.getFullYear()}</span>
              </h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigateMonth(-1)} data-testid="prev-month">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigateMonth(1)} data-testid="next-month">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_SHORT.map((day) => (
                <div key={day} className="text-center text-[10px] font-medium text-muted-foreground/60">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          </div>

          {/* Today Button */}
          <div className="px-4 py-2 border-b border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                setCurrentDate(new Date());
                setSelectedDate(new Date());
              }}
              data-testid="button-today"
            >
              <Calendar className="w-3 h-3" />
              Hoy
            </Button>
          </div>

          {/* Today's Notes */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span>HOY</span>
                <span className="text-xs text-muted-foreground">
                  {selectedDate.toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                </span>
              </div>

              {todayNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 text-center py-4">
                  No hay notas para este día
                </p>
              ) : (
                todayNotes.map((note) => (
                  <Card
                    key={note.id}
                    className="border-l-4 cursor-pointer hover-elevate"
                    style={{ borderLeftColor: note.color }}
                    onClick={() => handleEdit(note)}
                    data-testid={`sidebar-note-${note.id}`}
                  >
                    <CardContent className="p-2">
                      <div className="flex items-center gap-1 mb-1">
                        {note.emoji && <span className="text-sm">{note.emoji}</span>}
                        <span className="text-xs font-semibold truncate">{note.title}</span>
                      </div>
                      {note.content && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{note.content}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground mt-4 pt-3 border-t border-border/50">
                    <Pin className="w-3 h-3 text-amber-500" />
                    <span>Fijadas</span>
                  </div>
                  {pinnedNotes.map((note) => (
                    <Card
                      key={note.id}
                      className="border-l-4 cursor-pointer hover-elevate"
                      style={{ borderLeftColor: note.color }}
                      onClick={() => handleEdit(note)}
                      data-testid={`pinned-note-${note.id}`}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-center gap-1 mb-1">
                          {note.emoji && <span className="text-sm">{note.emoji}</span>}
                          <span className="text-xs font-semibold truncate">{note.title}</span>
                          <Pin className="w-2.5 h-2.5 text-amber-500 ml-auto" />
                        </div>
                        {note.content && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{note.content}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Board Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {viewMode === "week" ? (
            <>
              {/* Week/Day Header */}
              <div className="flex-shrink-0 border-b border-border bg-card/30 overflow-x-auto">
                <div className="flex">
                  {/* Time column spacer */}
                  <div className="w-12 md:w-16 flex-shrink-0 border-r border-border/30 py-2 px-1 md:px-2 text-right">
                    <span className="text-[8px] md:text-[10px] text-muted-foreground hidden md:block">EST</span>
                  </div>
                  
                  {/* Days - Show only 1 day on mobile, all 7 on desktop */}
                  {getWeekDays().map((date, i) => {
                    const isCurrentDay = date.toDateString() === new Date().toDateString();
                    const isSelectedDay = date.toDateString() === selectedDate.toDateString();
                    const showDay = i === selectedDate.getDay() || window.innerWidth >= 768;
                    
                    return showDay && (
                      <div
                        key={i}
                        className={`flex-1 min-w-24 md:flex-1 py-2 px-1 text-center border-r border-border/30 last:border-r-0 cursor-pointer transition-colors ${
                          isSelectedDay ? "bg-primary/5" : "hover:bg-muted/30"
                        }`}
                        onClick={() => setSelectedDate(date)}
                        data-testid={`week-day-${i}`}
                      >
                        <div className="text-[9px] md:text-[10px] font-medium text-muted-foreground">
                          {DAYS_SHORT[date.getDay()]}
                        </div>
                        <div className={`text-base md:text-lg font-bold ${
                          isCurrentDay ? "w-6 h-6 md:w-8 md:h-8 rounded-full bg-cyan-500 text-white mx-auto flex items-center justify-center" : ""
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Grid */}
              <ScrollArea className="flex-1">
                <div className="flex min-h-[500px] md:min-h-[600px]">
                  {/* Time Labels */}
                  <div className="w-12 md:w-16 flex-shrink-0 border-r border-border/30">
                    {timeSlots.map((hour) => {
                      const is12Hour = hour === 12 ? 12 : (hour > 12 ? hour - 12 : hour);
                      const period = hour < 12 ? "AM" : "PM";
                      return (
                        <div key={hour} className="h-12 md:h-16 border-b border-border/20 pr-1 md:pr-2 pt-0.5">
                          <span className="text-[8px] md:text-[10px] text-muted-foreground block text-right">
                            <span className="md:hidden">{is12Hour}</span>
                            <span className="hidden md:inline">{is12Hour} {period}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Day Columns */}
                  {getWeekDays().map((date, dayIndex) => {
                    const showDay = dayIndex === selectedDate.getDay() || window.innerWidth >= 768;
                    const dayNotes = getNotesForDate(date);
                    const isSelectedDay = date.toDateString() === selectedDate.toDateString();
                    
                    return showDay && (
                      <div
                        key={dayIndex}
                        className={`flex-1 min-w-24 md:flex-1 border-r border-border/30 last:border-r-0 relative ${
                          isSelectedDay ? "bg-primary/5" : ""
                        }`}
                        data-testid={`day-column-${dayIndex}`}
                      >
                        {/* Time slot lines */}
                        {timeSlots.map((hour) => (
                          <div
                            key={hour}
                            className="h-12 md:h-16 border-b border-border/20 cursor-pointer hover:bg-muted/20 transition-colors"
                            onClick={() => {
                              setSelectedDate(date);
                              setFormData(prev => ({
                                ...prev,
                                date: date.toISOString().split("T")[0],
                              }));
                              setShowNoteForm(true);
                            }}
                            data-testid={`time-slot-${dayIndex}-${hour}`}
                          />
                        ))}

                        {/* Notes for this day */}
                        {dayNotes.map((note, noteIndex) => {
                          const noteHour = note.date ? new Date(note.date).getHours() : 9;
                          const topOffset = Math.max(0, (noteHour - 7) * 64);
                          
                          return (
                            <div
                              key={note.id}
                              className="absolute left-1 right-1 rounded-md p-2 cursor-pointer hover-elevate transition-all group"
                              style={{
                                top: `${topOffset + noteIndex * 4}px`,
                                backgroundColor: `${note.color}20`,
                                borderLeft: `3px solid ${note.color}`,
                                minHeight: "48px",
                              }}
                              onClick={() => handleEdit(note)}
                              data-testid={`board-note-${note.id}`}
                            >
                              <div className="flex items-center gap-1">
                                {note.emoji && <span className="text-xs">{note.emoji}</span>}
                                <span className="text-[11px] font-semibold text-foreground truncate">
                                  {note.title}
                                </span>
                                {note.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 ml-auto flex-shrink-0" />}
                              </div>
                              {note.content && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                                  {note.content}
                                </p>
                              )}
                              
                              {/* Hover Actions */}
                              <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 bg-background/80"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePinToggle(note);
                                  }}
                                  data-testid={`pin-note-${note.id}`}
                                >
                                  <Pin className={`w-3 h-3 ${note.isPinned ? "text-amber-500" : ""}`} />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 bg-background/80"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMutation.mutate(note.id);
                                  }}
                                  data-testid={`delete-note-${note.id}`}
                                >
                                  <Trash className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          ) : (
            /* Month View */
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {/* Day headers */}
                  {DAYS_SHORT.map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  
                  {/* Days grid */}
                  {Array.from({ length: 42 }, (_, i) => {
                    const firstDay = getFirstDayOfMonth(currentDate);
                    const daysInMonth = getDaysInMonth(currentDate);
                    const day = i - firstDay + 1;
                    
                    if (day <= 0 || day > daysInMonth) {
                      return <div key={i} className="aspect-square" />;
                    }
                    
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayNotes = getNotesForDate(date);
                    const isTodayDate = isToday(day);
                    
                    return (
                      <div
                        key={i}
                        className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all hover-elevate ${
                          isTodayDate ? "border-primary bg-primary/5" : "border-border bg-card"
                        }`}
                        onClick={() => {
                          setSelectedDate(date);
                          setFormData(prev => ({
                            ...prev,
                            date: date.toISOString().split("T")[0],
                          }));
                          setShowNoteForm(true);
                        }}
                        data-testid={`month-day-${day}`}
                      >
                        <div className="text-xs font-semibold mb-1 text-foreground">{day}</div>
                        <div className="space-y-0.5">
                          {dayNotes.slice(0, 2).map((note) => (
                            <div
                              key={note.id}
                              className="text-[9px] px-1.5 py-0.5 rounded truncate text-white cursor-pointer"
                              style={{ backgroundColor: note.color }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(note);
                              }}
                              data-testid={`month-note-${note.id}`}
                            >
                              {note.emoji && `${note.emoji} `}{note.title}
                            </div>
                          ))}
                          {dayNotes.length > 2 && (
                            <div className="text-[9px] text-muted-foreground px-1.5">
                              +{dayNotes.length - 2} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Note Form Dialog */}
      <Dialog open={showNoteForm} onOpenChange={setShowNoteForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-cyan-500" />
              {editingNote ? "Editar Nota" : "Nueva Nota"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title with Emoji */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0" data-testid="emoji-picker-trigger">
                    {formData.emoji || <Smile className="w-4 h-4" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        className="text-xl p-1 hover:bg-muted rounded"
                        onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                        data-testid={`emoji-${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Input
                placeholder="Título de la nota"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-note-title"
              />
            </div>

            {/* Content */}
            <Textarea
              placeholder="Escribe tu nota aquí..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
              data-testid="input-note-content"
            />

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Fecha (opcional)</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  data-testid="input-note-date"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hora (12h AM/PM)</label>
                <div className="flex gap-1">
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    data-testid="input-note-time"
                  />
                </div>
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                <Palette className="w-3 h-3" /> Color
              </label>
              <div className="flex flex-wrap gap-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                      formData.color === color.hex ? "ring-2 ring-offset-2 ring-foreground" : ""
                    }`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.hex }))}
                    title={color.name}
                    data-testid={`color-${color.id}`}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              {editingNote && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteMutation.mutate(editingNote.id);
                    resetForm();
                  }}
                  data-testid="button-delete-note"
                >
                  <Trash className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={resetForm} data-testid="button-cancel">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-note"
              >
                {editingNote ? "Guardar" : "Crear Nota"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
