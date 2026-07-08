import { InnerPageHeader } from "@/components/call-agent/inner-page-header";
import { NewAgentForm } from "@/components/call-agent/forms/new-agent-form";
import { ROUTES } from "@/lib/constants";

export default function NewAgentPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <InnerPageHeader
        backHref={`${ROUTES.callAgent}?tab=agents`}
        backLabel="Back to agents"
        title="Create agent"
        description="Set up profile, voice, OpenAI training configuration, and capabilities in one step"
      />
      <NewAgentForm />
    </div>
  );
}
