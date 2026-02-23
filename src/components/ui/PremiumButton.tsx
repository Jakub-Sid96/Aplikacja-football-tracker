import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";
import type { PremiumButtonProps } from "./PremiumButton.types";
import "./PremiumButton.css";

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      variant = "navy",
      size = "md",
      iconOnly = false,
      icon,
      iconPosition = "left",
      className,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const [spinning, setSpinning] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (icon && !spinning) {
          setSpinning(true);
          timeoutRef.current = setTimeout(() => {
            setSpinning(false);
          }, 650);
        }
        onClick?.(e);
      },
      [icon, spinning, onClick]
    );

    const ariaLabel =
      iconOnly && !props["aria-label"] && typeof children === "string"
        ? children
        : props["aria-label"];

    const iconEl = icon ? (
      <span className={cn("pbtn__icon", spinning && "pbtn__icon--spinning")}>
        {icon}
      </span>
    ) : null;

    return (
      <button
        ref={ref}
        className={cn(
          "pbtn",
          `pbtn--${variant}`,
          `pbtn--${size}`,
          iconOnly && "pbtn--icon-only",
          className
        )}
        onClick={handleClick}
        aria-label={ariaLabel}
        {...props}
      >
        {iconPosition === "left" && iconEl}
        {!iconOnly && children && <span className="pbtn__label">{children}</span>}
        {iconPosition === "right" && iconEl}
      </button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

export default PremiumButton;
