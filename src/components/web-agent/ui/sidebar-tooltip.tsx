"use client";

type SidebarTooltipProps = {
  label: string;
  children: React.ReactNode;
  show?: boolean;
};

export function SidebarTooltip({ label, children, show = true }: SidebarTooltipProps) {
  if (!show) return <>{children}</>;

  return (
    <div className="sidebar-tooltip-wrap group relative flex w-full justify-center">
      {children}
      <span className="sidebar-tooltip pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap opacity-0 transition-all duration-200 group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}
