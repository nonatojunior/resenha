import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { buttonClass, type ButtonSize, type ButtonVariant } from '../lib/buttonClass';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  loading = false,
  icon,
  children,
  className,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[buttonClass(variant, { size, full }), className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="spin" size={20} aria-hidden="true" /> : icon}
      <span>{children}</span>
    </button>
  );
}

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  full = false,
  icon,
  children,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={[buttonClass(variant, { size, full }), className].filter(Boolean).join(' ')} {...props}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}
