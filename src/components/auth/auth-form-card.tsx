import type { ReactNode } from "react";

export function AuthFormCard({ children }: { children: ReactNode }) {
  return (
    <div className="auth-form-card">
      <div className="auth-form-card-inner">{children}</div>
    </div>
  );
}
