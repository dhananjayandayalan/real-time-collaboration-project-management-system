import React, { forwardRef, useId } from 'react';
import './Input.css';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  inputSize?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      inputSize = 'md',
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;

    const wrapperClassNames = [
      'input-wrapper',
      fullWidth ? 'input-wrapper--full-width' : '',
      error ? 'input-wrapper--error' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const inputClassNames = [
      'input',
      `input--${inputSize}`,
      leftIcon ? 'input--with-left-icon' : '',
      rightIcon ? 'input--with-right-icon' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={inputId} className="input__label">
            {label}
          </label>
        )}
        <div className="input__container">
          {leftIcon && <span className="input__icon input__icon--left">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={inputClassNames}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && <span className="input__icon input__icon--right">{rightIcon}</span>}
        </div>
        {error && (
          <span id={`${inputId}-error`} className="input__error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${inputId}-hint`} className="input__hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
