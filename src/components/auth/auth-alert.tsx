type AuthAlertProps = {
  children: React.ReactNode;
  variant?: "success" | "error";
};

export function AuthAlert({ children, variant = "success" }: AuthAlertProps) {
  return (
    <div
      role="status"
      className={`auth-alert ${variant === "success" ? "auth-alert-success" : "auth-alert-error"}`}
    >
      {variant === "success" && (
        <svg viewBox="0 0 20 20" className="auth-alert-icon" fill="none" aria-hidden>
          <path
            d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M6.66667 10L8.88889 12.2222L13.3333 7.77778"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{children}</span>
    </div>
  );
}
