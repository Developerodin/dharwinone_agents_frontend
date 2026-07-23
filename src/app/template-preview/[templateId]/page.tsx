import { notFound } from "next/navigation";
import { BaseTemplate } from "@/templates/BaseTemplate";
import { PACKAGES, type TemplateId } from "@/templates/packages";
import { TemplateMetaBar } from "../catalog-ui";

export function generateStaticParams() {
  return Object.keys(PACKAGES).map((templateId) => ({ templateId }));
}

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  if (!(templateId in PACKAGES)) notFound();
  const reg = PACKAGES[templateId as TemplateId].registry;
  return (
    <>
      <TemplateMetaBar reg={reg} />
      <BaseTemplate templateId={templateId as TemplateId} />
    </>
  );
}
