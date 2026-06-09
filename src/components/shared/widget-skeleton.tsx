export function WidgetSkeleton() {
  return (
    <div className="h-full flex flex-col gap-3 p-1 animate-pulse">
      <div className="h-3 w-1/3 rounded-full bg-surface-raised" />
      <div className="h-3 w-2/3 rounded-full bg-surface-raised" />
      <div className="h-3 w-1/2 rounded-full bg-surface-raised" />
      <div className="flex-1 rounded-lg bg-surface-raised" />
    </div>
  );
}
