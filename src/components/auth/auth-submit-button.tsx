import type { ButtonHTMLAttributes } from "react";

type AuthSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function AuthSubmitButton({
  children,
  className = "",
  ...props
}: AuthSubmitButtonProps) {
  return (
    <button type="submit" className={`auth-submit-btn ${className}`} {...props}>
      {children}
    </button>
  );
}
