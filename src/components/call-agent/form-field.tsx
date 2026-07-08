import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full rounded-xl border border-defaultborder bg-white px-4 text-sm text-defaulttextcolor outline-none transition-colors focus:border-brand-green";

type FormFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-defaulttextcolor">{label}</label>
      {children}
      {hint && <p className="m-0 text-xs text-textmuted">{hint}</p>}
    </div>
  );
}

export function FormInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`${fieldClass} h-12 placeholder:text-textmuted/70 ${className}`}
    />
  );
}

export function FormSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldClass} h-12 ${className}`}>
      {children}
    </select>
  );
}

export function FormTextarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${fieldClass} resize-none p-4 placeholder:text-textmuted/70 ${className}`}
    />
  );
}
