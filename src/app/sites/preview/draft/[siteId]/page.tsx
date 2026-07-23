import { DraftSitePreview } from "@/components/site-preview/draft-site-preview";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ v?: string }>;
};

export default async function DraftSitePreviewPage({ params, searchParams }: PageProps) {
  const { siteId } = await params;
  const { v } = await searchParams;
  return <DraftSitePreview siteId={siteId} cacheVersion={v} />;
}
