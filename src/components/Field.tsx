import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  counter?: string;
  children: ReactNode;
}

function FieldShell({ id, label, hint, error, counter, children }: FieldShellProps) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <div className="field__top">
        <label htmlFor={id}>{label}</label>
        {counter ? <span className="field__counter">{counter}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string | null;
  counter?: string;
}

export function TextField({ label, hint, error, counter, className, ...props }: TextFieldProps) {
  const generatedId = useId();
  const id = props.name ? `${props.name}-${generatedId}` : generatedId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} counter={counter}>
      <input
        id={id}
        className={['input', className].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldShell>
  );
}

interface TextareaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string | null;
  counter?: string;
}

export function TextareaField({
  label,
  hint,
  error,
  counter,
  className,
  ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const id = props.name ? `${props.name}-${generatedId}` : generatedId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} counter={counter}>
      <textarea
        id={id}
        className={['input', 'textarea', className].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}

export function SelectField({ label, hint, error, className, children, ...props }: SelectFieldProps) {
  const generatedId = useId();
  const id = props.name ? `${props.name}-${generatedId}` : generatedId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        className={['input', 'select', className].filter(Boolean).join(' ')}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

interface SwitchFieldProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SwitchField({ label, description, checked, onChange, disabled }: SwitchFieldProps) {
  const id = useId();
  return (
    <div className="switch-field">
      <div>
        <label htmlFor={id}>{label}</label>
        <p>{description}</p>
      </div>
      <input
        id={id}
        type="checkbox"
        className="switch"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  );
}

interface CheckboxFieldProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
}

export function CheckboxField({ label, checked, onChange, error }: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className={`checkbox-field ${error ? 'field--error' : ''}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-invalid={Boolean(error)}
      />
      <label htmlFor={id}>{label}</label>
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
