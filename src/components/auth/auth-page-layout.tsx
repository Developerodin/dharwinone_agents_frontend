import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { AuthPromoPanel } from "./auth-promo-panel";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell min-h-screen w-full">
      <div className="auth-shell-bg pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="auth-orb auth-orb-green" />
        <div className="auth-orb auth-orb-navy" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <AuthPromoPanel />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="auth-topbar flex shrink-0 items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
            <BrandLogo className="lg:hidden" />
            <div className="hidden lg:block" />
            <a
              href="https://dharwinone.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="auth-back-link"
            >
              Back to website
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
                <path
                  d="M6 3L11 8L6 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </header>

          <main className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-6 sm:pb-10 lg:px-10 lg:pb-12">
            <div className="auth-form-shell w-full max-w-[440px] min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
