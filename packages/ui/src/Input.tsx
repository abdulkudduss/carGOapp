import { forwardRef, useCallback, useId } from 'react';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';
import { cx } from './util.ts';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Helper text under the field (muted). Hidden when `error` is set. */
  hint?: string;
  /** Error message under the field; also flips the field to the invalid style. */
  error?: string;
  /** Force the invalid style without a message (e.g. RHF tracks the message). */
  invalid?: boolean;
  /** Monospace + letter-spacing — for codes (parcel_code, track, OTP). */
  mono?: boolean;
  /** Class on the outer `.cui-field` wrapper (the input keeps `className`). */
  containerClassName?: string;
}

/**
 * Input — controlled or uncontrolled, RHF-ready (it forwards the ref and spreads
 * `...rest`, so `register()` works untouched). It owns NO form/validation logic;
 * `error`/`invalid` are presentation only. Label/hint/error are wired with
 * aria-* so screen readers announce them.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, invalid, mono, containerClassName, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedById = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;
  const isInvalid = invalid || Boolean(error);

  return (
    <div className={cx('cui', 'cui-field', containerClassName)}>
      {label && (
        <label className="cui-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cx('cui-input', mono && 'cui-input--mono', isInvalid && 'cui-input--invalid', className)}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedById}
        {...rest}
      />
      {error ? (
        <span id={`${inputId}-err`} className="cui-error" role="alert">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${inputId}-hint`} className="cui-hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
});

export interface ScannerFieldProps extends Omit<InputProps, 'type' | 'onSubmit'> {
  /** Fired on Enter with the current trimmed value (a scanner emits Enter). */
  onScan: (value: string) => void;
  /** Select existing text on focus so the next scan overwrites it. Default on. */
  selectOnFocus?: boolean;
}

/**
 * ScannerField — Input tuned for hardware-scanner intake at the warehouse
 * (step 5). It only carries the field *behavior*, not the intake logic:
 *   - autofocus by default, so a scan lands without a click;
 *   - select-on-focus, so each scan replaces the previous code;
 *   - Enter (what a scanner sends after the payload) → `onScan(value)`;
 *   - forwards its ref, so the screen can programmatically re-focus after it
 *     submits the scanned code and clears the field.
 */
export const ScannerField = forwardRef<HTMLInputElement, ScannerFieldProps>(function ScannerField(
  { onScan, selectOnFocus = true, mono = true, autoFocus = true, onKeyDown, onFocus, ...rest },
  ref,
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.key === 'Enter' && !e.defaultPrevented) {
        e.preventDefault();
        const value = e.currentTarget.value.trim();
        if (value) onScan(value);
      }
    },
    [onKeyDown, onScan],
  );

  return (
    <Input
      ref={ref}
      mono={mono}
      autoFocus={autoFocus}
      inputMode="text"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="characters"
      spellCheck={false}
      onKeyDown={handleKeyDown}
      onFocus={(e) => {
        if (selectOnFocus) e.currentTarget.select();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
});
