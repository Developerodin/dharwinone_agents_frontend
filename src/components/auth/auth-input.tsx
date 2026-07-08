import type { InputHTMLAttributes, ReactNode } from "react";
import { PasswordToggle } from "./password-toggle";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  labelExtra?: ReactNode;
  error?: string;
};

export function AuthInput({
  label,
  labelExtra,
  error,
  className = "",
  ...props
}: AuthInputProps) {
  return (
    <div className="auth-field">
      <div className="auth-field-label-row">
        <label htmlFor={props.id} className="auth-field-label">
          {label}
        </label>
        {labelExtra}
      </div>
      <input
        {...props}
        aria-invalid={error ? true : undefined}
        className={`auth-input ${error ? "auth-input-error" : ""} ${className}`}
      />
      {error && (
        <p className="auth-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthPasswordInput({
  label,
  labelExtra,
  showPassword,
  onToggle,
  error,
  className = "",
  ...props
}: AuthInputProps & {
  showPassword: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="auth-field">
      <div className="auth-field-label-row">
        <label htmlFor={props.id} className="auth-field-label">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="auth-input-wrap">
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          className={`auth-input auth-input-password ${error ? "auth-input-error" : ""} ${className}`}
        />
        <PasswordToggle visible={showPassword} onToggle={onToggle} />
      </div>
      {error && (
        <p className="auth-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
