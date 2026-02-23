import type React from "react";

export type PremiumButtonVariant = 'navy' | 'blue' | 'emerald' | 'violet' | 'rose' | 'amber';
export type PremiumButtonSize = 'sm' | 'md' | 'lg';

export interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PremiumButtonVariant;
  size?: PremiumButtonSize;
  iconOnly?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}
