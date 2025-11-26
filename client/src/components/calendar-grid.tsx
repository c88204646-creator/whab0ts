import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

interface CalendarGridProps {
  year: number;
  month: number;
  monthName: string;
  weekDays: string[];
  calendarDays: (Date | null)[];
  canNavigatePrevious: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  availability: Array<{ dayOfWeek: number; isActive: boolean }>;
  dayEvents?: Array<any>; // Optional for showing events in cells
  showEvents?: boolean; // Whether to show events in day cells
  getEventsForDate?: (date: Date) => Array<any>; // Optional function to get events
  hideAvailabilityIndicators?: boolean; // Hide the checkmark/X indicators
  minimalSize?: boolean; // Use smaller sizes for mini-calendar
}

export function CalendarGrid({
  year,
  month,
  monthName,
  weekDays,
  calendarDays,
  canNavigatePrevious,
  onPrevMonth,
  onNextMonth,
  selectedDate,
  onSelectDate,
  availability,
  dayEvents,
  showEvents = false,
  getEventsForDate,
  hideAvailabilityIndicators = false,
  minimalSize = false,
}: CalendarGridProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPastDate = (date: Date) => {
    const dateForComparison = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    dateForComparison.setHours(0, 0, 0, 0);
    return dateForComparison < today;
  };

  const hasAvailability = (date: Date) => {
    return availability.some(a => a.dayOfWeek === date.getDay() && a.isActive);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  if (minimalSize) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={!canNavigatePrevious}
              onClick={onPrevMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="inline-flex items-center px-4 py-2 bg-secondary/40 border border-border/70 rounded-lg">
              <span className="text-xs font-bold text-foreground uppercase">{monthName}</span>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-[10px] font-bold text-muted-foreground/80 py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} />;
              }

              const dayOfWeek = date.getDay();
              const hasAvail = availability.some(a => a.dayOfWeek === dayOfWeek && a.isActive);
              const isPast = isPastDate(date);
              const isTday = isToday(date);
              const isSelec = isSelected(date);

              return (
                <div key={idx}>
                  <button
                    onClick={() => !isPast && onSelectDate(date)}
                    disabled={isPast}
                    className={`
                      w-full aspect-square p-0.5 rounded text-[10px] font-medium
                      transition-all duration-200 flex flex-col items-start justify-start gap-0.5 overflow-hidden
                      relative
                      ${isPast
                        ? "bg-muted/20 border border-border/30 text-muted-foreground/50 cursor-not-allowed opacity-50"
                        : isTday
                        ? "bg-primary/20 text-primary-foreground border border-primary/50"
                        : isSelec
                          ? "bg-primary/30 border-2 border-primary"
                          : "bg-secondary/40 border border-border/60 hover-elevate"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between w-full flex-shrink-0">
                      <span className="text-[10px] font-semibold text-foreground">{date.getDate()}</span>
                      {!hideAvailabilityIndicators && (
                        <div className="absolute top-0.5 right-0.5">
                          {hasAvail ? (
                            <CheckCircle2 className="w-2 h-2 text-primary" />
                          ) : (
                            <XCircle className="w-2 h-2 text-muted-foreground/60" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full-size calendar
  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevMonth}
            disabled={!canNavigatePrevious}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="inline-flex items-center px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
            <span className="text-xs font-bold text-foreground uppercase tracking-tight">{monthName}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-1 mb-3">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-bold text-muted-foreground uppercase py-2 tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} />;
            }

            const dayOfWeek = date.getDay();
            const hasAvail = hasAvailability(date);
            const isPast = isPastDate(date);
            const isTday = isToday(date);
            const isSelec = isSelected(date);
            const events = showEvents && getEventsForDate ? getEventsForDate(date) : [];

            return (
              <div key={idx}>
                <button
                  onClick={() => !isPast && onSelectDate(date)}
                  disabled={isPast}
                  className={`
                    w-full aspect-square p-1 rounded-lg text-xs font-medium
                    transition-all duration-150 flex flex-col items-start justify-start gap-1 overflow-hidden
                    relative cursor-pointer
                    ${isPast
                      ? "bg-muted/15 border border-border/40 text-muted-foreground/40 cursor-not-allowed"
                      : isTday
                      ? "bg-primary/25 text-primary-foreground border-2 border-primary shadow-md"
                      : isSelec
                        ? "bg-primary/35 border-2 border-primary shadow-md"
                        : "bg-card border border-border/50 hover:bg-secondary/30 hover:border-border/70 hover:shadow-sm"
                    }
                  `}
                >
                  <div className="flex items-center justify-between w-full flex-shrink-0">
                    <span className={`text-xs font-bold ${isPast ? 'text-muted-foreground/40' : 'text-foreground'}`}>{date.getDate()}</span>
                    {!hideAvailabilityIndicators && (
                      <div className="absolute top-1 right-1">
                        {hasAvail ? (
                          <div className="w-2 h-2 rounded-full bg-primary shadow-sm"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                        )}
                      </div>
                    )}
                  </div>
                  {showEvents && events.length > 0 && (
                    <div className="w-full space-y-0.5 overflow-y-auto max-h-6">
                      {events.slice(0, 2).map((event: any) => (
                        <div key={event.id} className="w-full">
                          <div className={`w-full text-[8px] rounded px-0.5 py-0.5 truncate font-semibold whitespace-nowrap flex items-center gap-0.5 ${isTday || isSelec ? 'bg-primary text-primary-foreground' : 'bg-primary/70 text-primary-foreground'} shadow-sm`}>
                            {event.isPublicBooking && (
                              <svg className="w-1 h-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 10a2 2 0 104 0 2 2 0 00-4 0z" />
                              </svg>
                            )}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-[7px] text-muted-foreground/70 px-0.5">+{events.length - 2}</div>
                      )}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
