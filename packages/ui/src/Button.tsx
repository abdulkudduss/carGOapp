import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cx } from './util.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Stretch to the container width (forms, sheets). */
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'cui-btn--primary',
  secondary: 'cui-btn--secondary',
  ghost: 'cui-btn--ghost',
  danger: 'cui-btn--danger',
};

/**
 * Button — sizing comes entirely from the active density (`data-density` on an
 * app root), never from props, so the same component is compact in web-ops and
 * ≥44px-tall in pvz. Type defaults to `button` so it never submits a form by
 * accident.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', fullWidth = false, type = 'button', className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'cui',
        'cui-focusable',
        'cui-btn',
        VARIANT_CLASS[variant],
        fullWidth && 'cui-btn--full',
        className,
      )}
      {...rest}
    />
  );
});
