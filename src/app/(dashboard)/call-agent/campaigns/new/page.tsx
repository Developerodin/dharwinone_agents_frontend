import { InnerPageHeader } from "@/components/call-agent/inner-page-header";
import { NewCampaignForm } from "@/components/call-agent/forms/new-campaign-form";
import { ROUTES } from "@/lib/constants";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <InnerPageHeader
        backHref={`${ROUTES.callAgent}?tab=campaigns`}
        backLabel="Back to campaigns"
        title="New campaign"
        description="Select an agent, set the schedule, then upload your lead list"
      />
      <NewCampaignForm />
    </div>
  );
}
