import Image from "next/image";

const FEATURES = [
  {
    title: "AI calling agents",
    description: "Deploy intelligent voice agents for outbound and inbound campaigns.",
  },
  {
    title: "Campaign workspace",
    description: "Manage dialer, history, and analytics from one unified dashboard.",
  },
  {
    title: "Built for retailers",
    description: "Purpose-built tools to scale customer outreach with confidence.",
  },
] as const;

export function AuthPromoPanel() {
  return (
    <aside
      className="auth-promo-panel relative hidden lg:flex lg:w-[min(44%,520px)] lg:shrink-0 flex-col justify-between overflow-hidden p-10 xl:p-12"
      aria-hidden
    >
      <div className="auth-promo-grid pointer-events-none absolute inset-0" />

      <div className="relative z-10">
  <div className="flex items-center gap-3">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-white/20">
      <Image
        src="/images/logo-mark.svg"
        alt=""
        width={28}
        height={28}
      />
    </div>

    <div className="flex flex-col leading-none text-white">
      <span className="font-poppins text-lg font-semibold tracking-tight">
        Dharwin
      </span>
      <span className="font-poppins text-sm font-medium tracking-tight">
        One
      </span>
    </div>
  </div>
</div>

      <div className="relative z-10 space-y-8">
        <div className="space-y-4">
          <p className="m-0 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/80 ring-1 ring-white/10">
            Retail AI platform
          </p>
          <h2 className="m-0 font-poppins text-[2rem] font-semibold leading-tight tracking-tight text-white xl:text-[2.25rem]">
            Scale customer outreach with intelligent voice agents
          </h2>
          <p className="m-0 max-w-md text-[0.9375rem] leading-relaxed text-white/70">
            Join retailers using Dharwin One to automate calls, track campaigns,
            and grow revenue — all from a single workspace.
          </p>
        </div>

        <ul className="m-0 list-none space-y-4 p-0">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex gap-3.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green/20 ring-1 ring-brand-green/30">
                <svg
                  viewBox="0 0 12 12"
                  className="h-3 w-3 text-brand-green"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold text-white">{feature.title}</p>
                <p className="m-0 mt-0.5 text-sm leading-relaxed text-white/60">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 m-0 text-xs text-white/40">
        &copy; {new Date().getFullYear()} Dharwin One. All rights reserved.
      </p>
    </aside>
  );
}
