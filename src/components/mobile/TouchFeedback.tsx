import { useState, useRef, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RippleEffect {
  x: number;
  y: number;
  id: number;
}

interface TouchFeedbackProps {
  children: ReactNode;
  onClick?: () => void;
  onTouchStart?: () => void;
  className?: string;
  disabled?: boolean;
  haptic?: boolean;
  rippleColor?: string;
  scaleOnPress?: boolean;
  style?: React.CSSProperties;
  as?: 'button' | 'div';
}

export const TouchFeedback = ({
  children,
  onClick,
  onTouchStart,
  className = '',
  disabled = false,
  haptic = true,
  rippleColor = 'bg-primary/25',
  scaleOnPress = true,
  style,
  as: Component = 'button',
}: TouchFeedbackProps) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const elementRef = useRef<HTMLButtonElement | HTMLDivElement>(null);

  const createRipple = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const id = Date.now();
    setRipples(prev => [...prev, { x, y, id }]);

    // Haptic feedback
    if (haptic && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }

    // Clean up ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 600);
  }, [disabled, haptic]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPressed(true);
    createRipple(e);
    onTouchStart?.();
  };

  const handlePointerUp = () => {
    setIsPressed(false);
  };

  const handleClick = () => {
    if (!disabled) {
      onClick?.();
    }
  };

  const commonProps = {
    ref: elementRef as any,
    className: cn(
      "relative overflow-hidden select-none",
      scaleOnPress && "transition-transform duration-100",
      scaleOnPress && isPressed && "scale-[0.97]",
      disabled && "opacity-50 pointer-events-none",
      className
    ),
    style,
    onMouseDown: handlePointerDown,
    onMouseUp: handlePointerUp,
    onMouseLeave: handlePointerUp,
    onTouchStart: handlePointerDown,
    onTouchEnd: handlePointerUp,
    onClick: handleClick,
  };

  return (
    <Component {...commonProps} disabled={disabled}>
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className={cn(
            "absolute rounded-full pointer-events-none",
            "animate-ripple",
            rippleColor
          )}
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      {children}
    </Component>
  );
};
