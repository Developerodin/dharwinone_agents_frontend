import Link from "next/link";
import { notFound } from "next/navigation";
import { LaunchTemplatePreview } from "@/components/site-preview/launch-template-preview";
import { ROUTES } from "@/lib/constants";
import { LAUNCH_TEMPLATES, type LaunchTemplateId } from "@/templates/launch/SiteRenderer";

export function generateStaticParams() {
  return Object.keys(LAUNCH_TEMPLATES).map((templateId) => ({ templateId }));
}

export default async function LaunchTemplatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ siteId?: string }>;
}) {
  const { templateId } = await params;
  const { siteId } = await searchParams;
  if (!(templateId in LAUNCH_TEMPLATES)) notFound();
  const reg = LAUNCH_TEMPLATES[templateId as LaunchTemplateId].registry;

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 px-4 py-2 text-xs text-gray-600 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-gray-900">{reg.id}</strong>
          <span>·</span>
          {reg.category}/{reg.subcategory}
          <span>·</span>
          {reg.style_tags.join(", ")}
          <span>·</span>
          v{reg.version}
          {siteId ? (
            <Link
              href={ROUTES.siteEditor(siteId)}
              className="ml-auto rounded-md bg-[#41a454] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#369548]"
            >
              Edit site
            </Link>
          ) : null}
        </div>
      </div>
      <LaunchTemplatePreview templateId={templateId as LaunchTemplateId} siteId={siteId} />
    </>
  );
}
