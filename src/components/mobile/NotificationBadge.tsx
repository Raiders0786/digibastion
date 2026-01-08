import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count?: number;
  showDot?: boolean;
  className?: string;
  pulse?: boolean;
}

export const NotificationBadge = ({ 
  count, 
  showDot = false,
  className,
  pulse = false,
}: NotificationBadgeProps) => {
  if (!count && !showDot) return null;

  // Dot indicator for boolean states (like "new" indicators)
  if (showDot && !count) {
    return (
      <span 
        className={cn(
          "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full",
          "bg-primary border-2 border-background",
          pulse && "animate-pulse",
          className
        )}
      />
    );
  }

  // Numbered badge for counts
  return (
    <span 
      className={cn(
        "absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full",
        "bg-destructive text-destructive-foreground",
        "text-[10px] font-bold flex items-center justify-center",
        "border-2 border-background shadow-sm",
        "animate-scale-in",
        pulse && "animate-pulse",
        className
      )}
    >
      {count && count > 99 ? '99+' : count}
    </span>
  );
};
