import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, Trash, Pencil, StickyNote, ChevronLeft, ChevronRight, 
  Calendar, Pin, Archive, GripVertical, X, Smile, Palette,
  LayoutGrid, CalendarDays, Move, Maximize2, Minimize2, RotateCw
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

const EMOJI_CATEGORIES = {
  favoritos: {
    name: "Favoritos",
    emojis: ["📌", "🎯", "💡", "🔥", "⭐", "❤️", "💰", "📞", "📧", "✅", "⚡", "🚀", "📝", "🎉", "💬", "👤"]
  },
  emociones: {
    name: "Emociones",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😌", "😔", "😑", "😐", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤮", "🤢", "🤮"]
  },
  negocios: {
    name: "Negocios",
    emojis: ["💼", "📊", "📈", "📉", "💹", "💲", "💱", "💳", "🏦", "🏪", "🏬", "🏢", "📱", "💻", "🖥️", "⌨️", "🖱️", "🖨️", "📠", "📞", "📱", "💾", "💿", "📀", "🧮", "📋", "📊", "📈", "📉"]
  },
  tareas: {
    name: "Tareas",
    emojis: ["✅", "☑️", "✔️", "❌", "❎", "⭕", "📝", "📋", "📄", "📃", "📑", "🗒️", "🗓️", "📅", "⏰", "⏱️", "⏲️", "🕰️", "🔔", "🔕", "📢", "📣", "📯", "🔐", "🔒", "🔓", "🔑", "🗝️"]
  },
  viajes: {
    name: "Viajes",
    emojis: ["✈️", "🚀", "🛸", "🚁", "🛶", "⛵", "🚤", "🛳️", "⛴️", "🛥️", "🚢", "🚧", "🚨", "⛽", "🚏", "🚇", "🚈", "🚉", "✨", "🌍", "🌎", "🌏", "🗺️", "🗿", "🏝️", "⛱️", "🏖️", "🏜️"]
  },
  deportes: {
    name: "Deportes",
    emojis: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🥏", "🎳", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "⛸️", "🎣", "🎽", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️", "🤺", "🤾"]
  },
  comida: {
    name: "Comida",
    emojis: ["🍕", "🍔", "🍟", "🍗", "🌭", "🍿", "🧆", "🌮", "🌯", "🥙", "🧆", "🥗", "🥘", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤", "🍙", "🍚", "🍌", "🍎", "🍊", "🍋", "🍌", "🍉"]
  },
  clima: {
    name: "Clima",
    emojis: ["☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌬️", "💨", "💧", "💦", "☔", "🌊", "🌫️", "🍂", "🍁", "🌸", "🌺", "🌻", "🌼", "🌷"]
  },
  animales: {
    name: "Animales",
    emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴"]
  },
  plantas: {
    name: "Plantas",
    emojis: ["🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🎍", "🎎", "🎏", "🍃", "🍂", "🍁", "🌿", "🌺", "🌻", "🌼", "🌷", "🌸", "💐", "🌹", "🥀", "🏵️"]
  },
};

const EMOJIS = Object.values(EMOJI_CATEGORIES).flatMap(cat => cat.emojis);

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
  const [viewMode, setViewMode] = useState<"board" | "week" | "month">("board");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<Date | null>(null);
  const [dayModalMode, setDayModalMode] = useState<"options" | "view">("options");
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>("favoritos");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    color: "#3b82f6",
    emoji: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
  });
  
  const [draggingNote, setDraggingNote] = useState<BoardNote | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(true);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.id) {
      setUserId(user.id);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data: notes = [], isLoading, refetch } = useQuery<BoardNote[]>({
    queryKey: ["/api/board-notes", userId],
    queryFn: () => userId ? fetch(`/api/board-notes/${userId}`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBoardNote) => {
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
      toast({ title: "Error", description: error.message || "No se pudo crear la nota", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<BoardNote> }) =>
      fetch(`/api/board-notes/${id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, userId }) 
      }).then(r => r.json()),
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
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "El título es obligatorio", variant: "destructive" });
      return;
    }

    if (!userId) {
      toast({ title: "Error", description: "No se pudo identificar al usuario", variant: "destructive" });
      return;
    }

    if (editingNote) {
      const dateTime = formData.date && formData.time 
        ? new Date(`${formData.date}T${formData.time}`)
        : null;
      
      updateMutation.mutate({
        id: editingNote.id,
        updates: {
          title: formData.title,
          content: formData.content,
          color: formData.color,
          emoji: formData.emoji || null,
          date: dateTime ? dateTime : null,
        },
      });
      resetForm();
    } else {
      const dateTime = formData.date && formData.time 
        ? new Date(`${formData.date}T${formData.time}`)
        : new Date();
      
      const randomRotation = Math.floor(Math.random() * 21) - 10; // -10 to +10 degrees
      const noteData = {
        userId: userId,
        title: formData.title,
        content: formData.content || null,
        color: formData.color,
        emoji: formData.emoji || null,
        date: dateTime.toISOString(),
        positionX: Math.floor(Math.random() * 400) + 50,
        positionY: Math.floor(Math.random() * 300) + 50,
        zIndex: Math.max(...notes.map(n => n.zIndex || 1), 0) + 1,
        isPinned: false,
        isArchived: false,
        width: 160,
        height: 120,
        rotation: randomRotation,
      };
      createMutation.mutate(noteData as any);
    }
  };

  const handleEdit = (note: BoardNote) => {
    // Show day modal with options instead of opening edit form directly
    const noteDate = note.date ? new Date(note.date) : new Date();
    setSelectedDate(noteDate);
    setSelectedDayForModal(noteDate);
    setDayModalMode("options");
    setShowDayModal(true);
  };

  const handleEditDirectly = (note: BoardNote) => {
    // Open edit form directly without showing options modal
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

  const handleMouseDown = useCallback((e: React.MouseEvent, note: BoardNote) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDraggingNote(note);
    
    updateMutation.mutate({
      id: note.id,
      updates: { zIndex: Math.max(...notes.map(n => n.zIndex || 1), 0) + 1 },
    });
  }, [notes, updateMutation]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingNote || !boardRef.current) return;
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - boardRect.left - dragOffset.x, boardRect.width - 240));
    const newY = Math.max(0, Math.min(e.clientY - boardRect.top - dragOffset.y, boardRect.height - 180));
    
    const noteElement = document.getElementById(`note-${draggingNote.id}`);
    if (noteElement) {
      noteElement.style.left = `${newX}px`;
      noteElement.style.top = `${newY}px`;
    }
  }, [draggingNote, dragOffset]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!draggingNote || !boardRef.current) {
      setDraggingNote(null);
      return;
    }
    
    const boardRect = boardRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - boardRect.left - dragOffset.x, boardRect.width - 240));
    const newY = Math.max(0, Math.min(e.clientY - boardRect.top - dragOffset.y, boardRect.height - 180));
    
    updateMutation.mutate({
      id: draggingNote.id,
      updates: { positionX: Math.round(newX), positionY: Math.round(newY) },
    });
    
    setDraggingNote(null);
  }, [draggingNote, dragOffset, updateMutation]);

  useEffect(() => {
    if (draggingNote) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingNote, handleMouseMove, handleMouseUp]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setSelectedDate(newDate);
    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const getNotesForDate = (date: Date) => {
    return notes.filter(note => {
      if (!note.date) return false;
      const noteDate = new Date(note.date);
      return noteDate.toDateString() === date.toDateString();
    });
  };

  const todayNotes = getNotesForDate(selectedDate);
  const pinnedNotes = notes.filter(n => n.isPinned && !n.isArchived);

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayNotes = getNotesForDate(date);
      const isTodayDate = isToday(day);
      const isSelected = date.toDateString() === selectedDate.toDateString();
      
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`aspect-square rounded-md text-xs flex flex-col items-center justify-center gap-0.5 transition-colors ${
            isTodayDate 
              ? "bg-primary text-primary-foreground font-semibold" 
              : isSelected
                ? "bg-primary/20 text-foreground font-medium"
                : "hover:bg-muted text-foreground"
          }`}
          data-testid={`calendar-day-${day}`}
        >
          <span>{day}</span>
          {dayNotes.length > 0 && (
            <div className="flex gap-0.5">
              {dayNotes.slice(0, 3).map((note, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: note.color }}
                />
              ))}
            </div>
          )}
        </button>
      );
    }
    
    return days;
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <StickyNote className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando pizarra...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full overflow-hidden bg-background ${isFullscreen ? 'fixed inset-0' : ''}`}
    >
      {/* Header */}
      <div className={`flex-shrink-0 border-b border-border bg-card/50 ${isFullscreen ? 'border-border/50' : ''}`}>
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <StickyNote className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Pizarra</h1>
                <p className="text-xs text-muted-foreground">
                  {notes.length} notas activas
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                data-testid="toggle-fullscreen"
                title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              
              {/* Sidebar Toggle - Desktop */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="toggle-sidebar"
              >
                {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
              
              {/* Navigation - Week/Calendar */}
              {viewMode !== "board" && (
                <div className="hidden md:flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => viewMode === "week" ? navigateWeek(-1) : navigateMonth(-1)}
                    data-testid="nav-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => viewMode === "week" ? navigateWeek(1) : navigateMonth(1)}
                    data-testid="nav-next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* View Mode Selector */}
              <div className="flex items-center bg-muted rounded-lg p-1">
                <Button
                  onClick={() => setViewMode("board")}
                  variant={viewMode === "board" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 gap-1.5"
                  data-testid="view-board"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pizarra</span>
                </Button>
                <Button
                  onClick={() => setViewMode("week")}
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 gap-1.5"
                  data-testid="view-week"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Semana</span>
                </Button>
                <Button
                  onClick={() => setViewMode("month")}
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs h-7 gap-1.5"
                  data-testid="view-month"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mes</span>
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
        {/* Left Sidebar - Mini Calendar & Notes List */}
        <ScrollArea className={`hidden md:flex md:flex-col overflow-hidden border-r border-border bg-card/30 transition-all duration-300 ${
          sidebarOpen ? "md:w-72" : "md:w-0"
        } [&>div>div]:scrollbar-thin [&>div>div]:scrollbar-thumb-rounded-lg [&>div>div]:scrollbar-track-transparent [&>div>div]:scrollbar-thumb-muted-foreground/30 hover:[&>div>div]:scrollbar-thumb-muted-foreground/50`}>
          <div className="flex flex-col h-full">
            {/* Mini Calendar */}
            <div className="p-4 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  {MONTHS[currentDate.getMonth()]} <span className="text-muted-foreground font-normal">{currentDate.getFullYear()}</span>
                </h2>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigateMonth(-1)} data-testid="prev-month">
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigateMonth(1)} data-testid="next-month">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_SHORT.map((day) => (
                  <div key={day} className="text-center text-[10px] font-medium text-muted-foreground/60">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {renderCalendarDays()}
              </div>
            </div>

            {/* Today Button */}
            <div className="px-4 py-3 border-b border-border/50 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                }}
                data-testid="button-today"
              >
                <Calendar className="w-3.5 h-3.5" />
                Hoy
              </Button>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-hidden">
            <div className="p-4 space-y-3">
              {/* Selected Date Notes */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {selectedDate.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                </span>
                {todayNotes.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {todayNotes.length}
                  </Badge>
                )}
              </div>

              {todayNotes.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 text-center py-6">
                  No hay notas para este día
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {todayNotes.map((note) => (
                    <Badge
                      key={note.id}
                      variant="secondary"
                      className="cursor-pointer hover-elevate transition-all text-white border-0 gap-1.5 py-1 px-2"
                      style={{ backgroundColor: note.color }}
                      onClick={() => handleEdit(note)}
                      data-testid={`sidebar-note-${note.id}`}
                    >
                      {note.emoji && <span className="text-[10px]">{note.emoji}</span>}
                      <span className="text-[10px] font-medium truncate max-w-[80px]">{note.title}</span>
                      {note.date && (
                        <span className="text-[9px] text-white/70">
                          {new Date(note.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                      )}
                      {note.isPinned && <Pin className="w-2.5 h-2.5 text-white/80" />}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div className="pt-3 border-t border-border/50 mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Pin className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Fijadas</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pinnedNotes.map((note) => (
                      <Badge
                        key={note.id}
                        variant="secondary"
                        className="cursor-pointer hover-elevate transition-all text-white border-0 gap-1.5 py-1 px-2"
                        style={{ backgroundColor: note.color }}
                        onClick={() => handleEdit(note)}
                        data-testid={`pinned-note-${note.id}`}
                      >
                        {note.emoji && <span className="text-[10px]">{note.emoji}</span>}
                        <span className="text-[10px] font-medium truncate max-w-[80px]">{note.title}</span>
                        {note.date && (
                          <span className="text-[9px] text-white/70">
                            {new Date(note.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                        )}
                        <Pin className="w-2 h-2 text-amber-200" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </ScrollArea>

        {/* Main Board Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {viewMode === "board" ? (
            /* Free Board View */
            <div 
              ref={boardRef}
              className="flex-1 relative overflow-auto bg-[radial-gradient(circle_at_1px_1px,_hsl(var(--muted))_1px,_transparent_0)] bg-[size:24px_24px]"
              style={{ cursor: draggingNote ? 'grabbing' : 'default' }}
            >
              {/* Instructions */}
              {notes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8 rounded-xl bg-card/80 backdrop-blur-sm border border-border max-w-sm">
                    <Move className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Tu pizarra está vacía</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crea notas y arrástralas libremente por el espacio
                    </p>
                    <Button onClick={() => setShowNoteForm(true)} data-testid="create-first-note">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear primera nota
                    </Button>
                  </div>
                </div>
              )}

              {/* Notes on Canvas */}
              {notes.map((note) => (
                <div
                  key={note.id}
                  id={`note-${note.id}`}
                  className={`absolute rounded-lg shadow-lg transition-all cursor-grab active:cursor-grabbing select-none group hover:scale-105 ${
                    draggingNote?.id === note.id ? 'shadow-2xl z-50 scale-105' : 'hover:shadow-xl'
                  }`}
                  style={{
                    left: `${note.positionX || 50}px`,
                    top: `${note.positionY || 50}px`,
                    width: `${note.width || 160}px`,
                    minHeight: `${note.height || 120}px`,
                    backgroundColor: note.color,
                    zIndex: note.zIndex || 1,
                    transform: `rotate(${(note as any).rotation || 0}deg)`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, note)}
                  data-testid={`board-note-${note.id}`}
                >
                  {/* Note Header */}
                  <div className="flex items-center justify-between p-2 pb-1 border-b border-white/20">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <GripVertical className="w-3 h-3 text-white/60 flex-shrink-0" />
                      {note.emoji && <span className="text-sm">{note.emoji}</span>}
                      <span className="font-semibold text-white truncate text-xs">{note.title}</span>
                    </div>
                    {note.isPinned && <Pin className="w-3 h-3 text-white/80 flex-shrink-0" />}
                  </div>

                  {/* Note Content */}
                  <div className="p-2 text-white/90 text-xs whitespace-pre-wrap line-clamp-4">
                    {note.content || <span className="text-white/50 italic text-[10px]">Sin contenido</span>}
                  </div>

                  {/* Note Footer */}
                  <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                    {note.date && (
                      <span className="text-[8px] text-white/60">
                        {new Date(note.date).toLocaleDateString("es-ES", { 
                          day: "numeric", 
                          month: "short"
                        })}
                      </span>
                    )}
                    
                    {/* Creator & Editor Avatars */}
                    <div className="flex items-center gap-0.5 ml-auto">
                      {note.createdByName && (
                        <Avatar className="w-4 h-4 ring-1 ring-white/30">
                          <AvatarFallback 
                            className="text-[7px] font-bold bg-white/30 text-white"
                          >
                            {note.createdByName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {note.lastEditedByName && note.lastEditedById !== note.createdById && (
                        <Avatar className="w-3.5 h-3.5 -ml-1 ring-1 ring-white/30">
                          <AvatarFallback 
                            className="text-[6px] font-bold bg-white/50 text-white"
                          >
                            {note.lastEditedByName.substring(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 bg-white/20 hover:bg-white/30 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(note);
                      }}
                      data-testid={`edit-note-${note.id}`}
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 bg-white/20 hover:bg-white/30 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentRotation = (note as any).rotation || 0;
                        const newRotation = (currentRotation + 15) % 360;
                        updateMutation.mutate({
                          id: note.id,
                          updates: { rotation: newRotation > 180 ? newRotation - 360 : newRotation },
                        });
                      }}
                      data-testid={`rotate-note-${note.id}`}
                    >
                      <RotateCw className="w-2.5 h-2.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 bg-white/20 hover:bg-white/30 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinToggle(note);
                      }}
                      data-testid={`pin-note-${note.id}`}
                    >
                      <Pin className={`w-2.5 h-2.5 ${note.isPinned ? "fill-white" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-5 w-5 bg-white/20 hover:bg-red-500/50 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(note.id);
                      }}
                      data-testid={`delete-note-${note.id}`}
                    >
                      <Trash className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === "week" ? (
            <>
              {/* Week View Header */}
              <div className="flex-shrink-0 border-b border-border bg-card/30">
                <div className="flex w-full">
                  <div className="w-12 md:w-16 flex-shrink-0 border-r border-border/30 py-2 px-1 md:px-2 text-right">
                    <span className="text-[8px] md:text-[10px] text-muted-foreground hidden md:block">EST</span>
                  </div>
                  
                  <div className="flex flex-1">
                    {getWeekDays().map((date, i) => {
                      const isCurrentDay = date.toDateString() === new Date().toDateString();
                      const isSelectedDay = date.toDateString() === selectedDate.toDateString();
                      const showDay = isMobile ? i === selectedDate.getDay() : true;
                      
                      return showDay && (
                        <div
                          key={i}
                          className={`flex-1 py-2 px-1 text-center border-r border-border/30 last:border-r-0 cursor-pointer transition-colors ${
                            isSelectedDay ? "bg-primary/5" : "hover:bg-muted/30"
                          }`}
                          onClick={() => setSelectedDate(date)}
                          data-testid={`week-day-${i}`}
                        >
                          <div className="text-[9px] md:text-[10px] font-medium text-muted-foreground">
                            {DAYS_SHORT[date.getDay()]}
                          </div>
                          <div className={`text-base md:text-lg font-bold ${
                            isCurrentDay ? "w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center" : ""
                          }`}>
                            {date.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Grid */}
              <ScrollArea className="flex-1">
                <div className="flex min-h-full" style={{ minHeight: isMobile ? "1152px" : "1536px" }}>
                  <div className="w-12 md:w-16 flex-shrink-0 border-r border-border/30">
                    {timeSlots.map((hour) => {
                      const is12Hour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
                      const period = hour < 12 ? "AM" : "PM";
                      return (
                        <div key={hour} className="h-12 md:h-16 border-b border-border/20 pr-1 md:pr-2 pt-0.5 flex items-center justify-end">
                          <span className="text-[8px] md:text-[10px] text-muted-foreground block text-right">
                            <span className="md:hidden">{is12Hour}</span>
                            <span className="hidden md:inline">{is12Hour} {period}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-1">
                    {getWeekDays().map((date, dayIndex) => {
                      const showDay = isMobile ? dayIndex === selectedDate.getDay() : true;
                      const dayNotes = getNotesForDate(date);
                      const isSelectedDay = date.toDateString() === selectedDate.toDateString();
                      
                      return showDay && (
                        <div
                          key={dayIndex}
                          className={`flex-1 border-r border-border/30 last:border-r-0 ${
                            isSelectedDay ? "bg-primary/5" : ""
                          }`}
                          data-testid={`day-column-${dayIndex}`}
                        >
                          {timeSlots.map((hour) => {
                            // Get notes for this specific hour
                            const hoursNotesForSlot = dayNotes.filter(n => {
                              const nHour = n.date ? new Date(n.date).getHours() : 9;
                              return nHour === hour;
                            });

                            return (
                              <div
                                key={hour}
                                className="h-12 md:h-16 border-b border-border/20 cursor-pointer hover:bg-muted/20 transition-colors p-1 flex flex-col gap-0.5 overflow-hidden"
                                onClick={() => {
                                  setSelectedDate(date);
                                  setSelectedDayForModal(date);
                                  setDayModalMode("options");
                                  setShowDayModal(true);
                                }}
                                data-testid={`time-slot-${dayIndex}-${hour}`}
                              >
                                {hoursNotesForSlot.slice(0, 2).map((note) => (
                                  <div
                                    key={note.id}
                                    className="text-[8px] px-1 py-0.5 rounded truncate text-white cursor-pointer font-medium flex items-center gap-0.5 hover-elevate"
                                    style={{ backgroundColor: note.color }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setShowDayModal(false);
                                      handleEdit(note);
                                    }}
                                    data-testid={`week-note-${note.id}`}
                                    title={note.title}
                                  >
                                    {note.emoji && <span className="flex-shrink-0">{note.emoji}</span>}
                                    <span className="truncate flex-1">{note.title}</span>
                                  </div>
                                ))}
                                {hoursNotesForSlot.length > 2 && (
                                  <div className="text-[7px] text-muted-foreground px-1 font-medium">
                                    +{hoursNotesForSlot.length - 2}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            /* Month View */
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_SHORT.map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  
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
                          setSelectedDayForModal(date);
                          setDayModalMode("options");
                          setShowDayModal(true);
                        }}
                        data-testid={`month-day-${day}`}
                      >
                        <div className="text-xs font-semibold mb-1 text-foreground">{day}</div>
                        <div className="space-y-0.5">
                          {dayNotes.slice(0, 2).map((note) => (
                            <div
                              key={note.id}
                              className="text-[9px] px-1.5 py-0.5 rounded truncate text-white cursor-pointer font-medium flex items-center gap-1 hover-elevate"
                              style={{ backgroundColor: note.color }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setShowDayModal(false);
                                handleEdit(note);
                              }}
                              data-testid={`month-note-${note.id}`}
                              title={note.title}
                            >
                              {note.emoji && <span className="flex-shrink-0">{note.emoji}</span>}
                              <span className="truncate flex-1">{note.title}</span>
                            </div>
                          ))}
                          {dayNotes.length > 2 && (
                            <div className="text-[8px] text-muted-foreground px-1.5 font-medium cursor-pointer hover:text-foreground">
                              +{dayNotes.length - 2}
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

      {/* Day Events Modal */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="w-[95vw] sm:max-w-sm p-3">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-sm">
              {dayModalMode === "view" ? "Notas del día" : "¿Qué deseas hacer?"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedDayForModal?.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </DialogDescription>
          </DialogHeader>
          
          {dayModalMode === "options" ? (
            /* Options Mode */
            <div className="flex flex-col gap-2">
              {selectedDayForModal && getNotesForDate(selectedDayForModal).length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setDayModalMode("view")}
                  className="h-8 justify-start text-xs"
                  data-testid="button-view-events"
                >
                  <Calendar className="w-3 h-3 mr-1.5" />
                  Ver notas ({getNotesForDate(selectedDayForModal).length})
                </Button>
              )}

              <Button
                onClick={() => {
                  if (selectedDayForModal) {
                    setFormData(prev => ({
                      ...prev,
                      date: selectedDayForModal.toISOString().split("T")[0],
                      time: "09:00",
                    }));
                    setEditingNote(null);
                    setShowDayModal(false);
                    setShowNoteForm(true);
                  }
                }}
                className="h-8 justify-start text-xs"
                data-testid="button-create-note-from-day-modal"
              >
                <Plus className="w-3 h-3 mr-1.5" />
                Crear nota
              </Button>
            </div>
          ) : (
            /* View Events Mode */
            <div className="space-y-2">
              {/* Events List */}
              <ScrollArea className="max-h-64 rounded-lg border border-border/50 bg-card/30">
                <div className="p-3 space-y-2">
                  {selectedDayForModal && getNotesForDate(selectedDayForModal).length > 0 ? (
                    getNotesForDate(selectedDayForModal).map((note) => (
                      <div
                        key={note.id}
                        className="p-2.5 rounded-md hover-elevate cursor-pointer transition-all group"
                        style={{ backgroundColor: `${note.color}12` }}
                        onClick={() => {
                          handleEditDirectly(note);
                          setShowDayModal(false);
                        }}
                        data-testid={`note-item-${note.id}`}
                      >
                        {/* Header with emoji, title and pin */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {note.emoji && <span className="text-base flex-shrink-0">{note.emoji}</span>}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-xs text-foreground break-words">{note.title}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                {note.date && (
                                  <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-2 h-2" />
                                    {new Date(note.date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })}
                                  </p>
                                )}
                                {/* User avatar */}
                                <div className="flex items-center gap-1">
                                  <Avatar className="w-4 h-4 border border-border/50">
                                    <AvatarFallback className="text-[7px] font-bold">{(note.userId || "?").charAt(0).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                </div>
                              </div>
                            </div>
                          </div>
                          {note.isPinned && (
                            <Pin className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        
                        {/* Content */}
                        {note.content && (
                          <p className="text-[10px] text-muted-foreground leading-relaxed break-words line-clamp-2">{note.content}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full py-8">
                      <p className="text-sm text-muted-foreground">No hay notas para este día</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Back Button */}
              <Button
                onClick={() => setDayModalMode("options")}
                className="w-full h-8 justify-start text-xs"
                data-testid="button-back-to-options"
              >
                ← Atrás
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Note Form Dialog */}
      <Dialog open={showNoteForm} onOpenChange={setShowNoteForm}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[95vh] overflow-y-auto p-4">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base">
              {editingNote ? "Editar Nota" : "Nueva Nota"}
            </DialogTitle>
            <DialogDescription className="text-xs flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 rounded" style={{ backgroundColor: formData.color }}>
                <StickyNote className="w-3 h-3 text-white" />
              </div>
              {editingNote ? "Modifica los detalles de tu nota" : "Crea una nueva nota"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Title with Emoji */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0" data-testid="emoji-picker-trigger">
                    {formData.emoji || <Smile className="w-4 h-4" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-2">
                  <div className="space-y-2">
                    {/* Category Tabs */}
                    <ScrollArea className="w-full">
                      <div className="flex gap-1 pb-2">
                        {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                          <button
                            key={key}
                            onClick={() => setSelectedEmojiCategory(key)}
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                              selectedEmojiCategory === key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                            data-testid={`emoji-category-${key}`}
                          >
                            {category.name.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Emojis Grid */}
                    <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
                      {EMOJI_CATEGORIES[selectedEmojiCategory as keyof typeof EMOJI_CATEGORIES]?.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          className="text-2xl p-1 hover:bg-muted rounded transition-colors"
                          onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                          data-testid={`emoji-${emoji}`}
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
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
                <label className="text-xs text-muted-foreground mb-0.5 block">Fecha (opcional)</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  data-testid="input-note-date"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-0.5 block">Hora (12h AM/PM)</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  data-testid="input-note-time"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Color Picker */}
            <div className="pb-2">
              <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Palette className="w-3 h-3" /> Color
              </label>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-0.5 flex-wrap">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color.id}
                      className={`w-5 h-5 rounded-full transition-transform hover:scale-110 border flex-shrink-0 ${
                        formData.color === color.hex ? "ring-1 ring-offset-1 ring-foreground border-foreground" : "border-border"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.hex }))}
                      title={color.name}
                      data-testid={`color-${color.id}`}
                    />
                  ))}
                  
                  {/* Custom Color Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={`w-5 h-5 rounded-full transition-transform hover:scale-110 border flex items-center justify-center flex-shrink-0 text-[8px] font-bold ${
                          !NOTE_COLORS.find(c => c.hex === formData.color) ? "ring-1 ring-offset-1 ring-foreground border-foreground" : "border-border"
                        }`}
                        style={{ backgroundColor: formData.color }}
                        title="Color personalizado"
                        data-testid="color-custom"
                      >
                        +
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4">
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-foreground block">Selecciona un color</label>
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                          className="w-full h-10 rounded cursor-pointer"
                          data-testid="input-custom-color"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={formData.color}
                            onChange={(e) => {
                              if (/^#[0-9A-F]{6}$/i.test(e.target.value) || /^rgb\([0-9,\s]+\)$/i.test(e.target.value)) {
                                setFormData(prev => ({ ...prev, color: e.target.value }));
                              }
                            }}
                            placeholder="#3b82f6 o rgb(59,130,246)"
                            className="text-xs"
                            data-testid="input-color-text"
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Formatos: #HEX o rgb(R,G,B)
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
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
