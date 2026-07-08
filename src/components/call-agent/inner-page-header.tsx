import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

type InnerPageHeaderProps = {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
};

export function InnerPageHeader({
  backHref,
  backLabel,
  title,
  description,
}: InnerPageHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-textmuted no-underline transition-colors hover:text-brand-green"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        {backLabel}
      </Link>

      <div>
        <h1 className="m-0 text-xl font-bold tracking-tight text-defaulttextcolor sm:text-2xl">
          {title}
        </h1>
        <p className="m-0 mt-1.5 text-sm text-textmuted">{description}</p>
      </div>
    </div>
  );
}
