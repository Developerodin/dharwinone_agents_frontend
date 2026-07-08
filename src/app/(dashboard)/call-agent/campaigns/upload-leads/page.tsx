import { InnerPageHeader } from "@/components/call-agent/inner-page-header";
import { UploadLeadsForm } from "@/components/call-agent/forms/upload-leads-form";
import { ROUTES } from "@/lib/constants";

export default function UploadLeadsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <InnerPageHeader
        backHref={`${ROUTES.callAgent}?tab=campaigns`}
        backLabel="Back to campaigns"
        title="Upload lead list"
        description="Import contacts via CSV or Excel and attach them to a campaign"
      />
      <UploadLeadsForm />
    </div>
  );
}
