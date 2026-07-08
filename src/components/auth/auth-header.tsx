type AuthHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthHeader({ eyebrow, title, description }: AuthHeaderProps) {
  return (
    <header className="auth-header text-center lg:text-left">
      <p className="auth-eyebrow m-0">{eyebrow}</p>
      <h1 className="auth-title m-0 mt-2">{title}</h1>
      <p className="auth-description m-0 mt-2">{description}</p>
    </header>
  );
}
