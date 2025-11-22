export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Animated spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin" />
        </div>
        {/* Optional loading text */}
        <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>
      </div>
    </div>
  );
}

export function LoadingSpinnerSmall() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin" />
      </div>
    </div>
  );
}
