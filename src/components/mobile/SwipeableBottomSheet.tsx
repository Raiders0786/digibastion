import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

interface SwipeableBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const SwipeableBottomSheet = ({
  open,
  onOpenChange,
  children,
  className,
}: SwipeableBottomSheetProps) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragY, setDragY] = React.useState(0);
  const startY = React.useRef(0);
  const currentY = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow drag from the handle area (top 60px)
    const touch = e.touches[0];
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const touchY = touch.clientY - rect.top;
    if (touchY > 80) return; // Only drag from top area
    
    setIsDragging(true);
    startY.current = touch.clientY;
    currentY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startY.current;
    
    // Only allow dragging down
    if (deltaY > 0) {
      currentY.current = deltaY;
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // If dragged more than 100px, close the sheet
    if (currentY.current > 100) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
      onOpenChange(false);
    }
    
    setDragY(0);
    currentY.current = 0;
  };

  return (
    <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay 
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <SheetPrimitive.Content
          ref={contentRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 bg-background shadow-2xl",
            "rounded-t-3xl border-t border-border/50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
            "data-[state=closed]:duration-200 data-[state=open]:duration-300",
            isDragging ? "transition-none" : "transition-transform",
            className
          )}
          style={{
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          }}
        >
          {/* Swipe indicator handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div 
              className={cn(
                "w-12 h-1.5 rounded-full bg-muted-foreground/30 transition-all duration-200",
                isDragging && "w-16 bg-muted-foreground/50"
              )}
            />
          </div>
          
          {/* Pull-down hint animation */}
          {dragY > 50 && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground animate-pulse">
              Release to close
            </div>
          )}
          
          {children}
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    </SheetPrimitive.Root>
  );
};

export const SwipeableSheetTitle = SheetPrimitive.Title;
export const SwipeableSheetDescription = SheetPrimitive.Description;
