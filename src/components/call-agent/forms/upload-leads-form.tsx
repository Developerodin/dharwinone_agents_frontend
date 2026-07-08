"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CAMPAIGNS } from "@/lib/call-agent-data";
import { ROUTES } from "@/lib/constants";
import { CheckCircleIcon, DownloadIcon } from "@/components/icons";
import { FormField, FormSelect } from "../form-field";

function UploadLeadsFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignParam = searchParams.get("campaign");

  const [campaignId, setCampaignId] = useState(
    campaignParam && CAMPAIGNS.some((c) => c.id === campaignParam) ? campaignParam : CAMPAIGNS[0]?.id ?? ""
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCampaign = CAMPAIGNS.find((c) => c.id === campaignId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file?.name ?? null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.push(`${ROUTES.callAgent}?tab=campaigns&leads=1`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 space-y-6">
      <div className="box">
        <div className="box-header">
          <div>
            <h2 className="box-title">Select campaign</h2>
            <p className="box-subtitle">Choose which campaign to attach the lead list to</p>
          </div>
        </div>
        <div className="box-body space-y-4">
          <FormField label="Campaign">
            <FormSelect
              id="upload-campaign"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              required
            >
              {CAMPAIGNS.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} — {campaign.agent}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {selectedCampaign && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Agent", value: selectedCampaign.agent },
                { label: "Status", value: selectedCampaign.status },
                { label: "Leads", value: selectedCampaign.leadsUploaded ? "Uploaded" : "Pending" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-defaultborder/50 bg-light/60 p-3">
                  <p className="m-0 text-[0.65rem] uppercase tracking-wide text-textmuted">{item.label}</p>
                  <p className="m-0 mt-0.5 text-sm font-semibold capitalize text-defaulttextcolor">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="box">
        <div className="box-header">
          <div>
            <h2 className="box-title">Upload lead list</h2>
            <p className="box-subtitle">Import contacts from CSV or Excel — stored for the worker queue</p>
          </div>
        </div>
        <div className="box-body space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-defaultborder/80 bg-light/50 px-6 py-10 text-center transition-colors hover:border-brand-green/40 hover:bg-brand-green/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
              <DownloadIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="m-0 text-sm font-semibold text-defaulttextcolor">
                {fileName ? fileName : "Drop a CSV or Excel file here or click to browse"}
              </p>
              <p className="m-0 mt-1 text-xs text-textmuted">
                Required columns: name, phone, company · Max 10,000 contacts
              </p>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              onChange={handleFileChange}
              required
            />
          </label>

          <div className="rounded-xl border border-brand-green/20 bg-brand-green/5 p-4 text-sm">
            <p className="m-0 font-semibold text-defaulttextcolor">Sample format</p>
            <pre className="m-0 mt-2 overflow-x-auto text-xs text-textmuted">
              name,phone,company{"\n"}John Smith,+15552345678,Acme Corp{"\n"}Lisa Chen,+15558765432,TechStart Inc
            </pre>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push(`${ROUTES.callAgent}?tab=campaigns`)}
          className="ti-btn ti-btn-light w-full sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !fileName}
          className="ti-btn ti-btn-primary-full w-full gap-2 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircleIcon className="h-4 w-4" />
          {isSubmitting ? "Uploading…" : "Upload leads to campaign"}
        </button>
      </div>
    </form>
  );
}

export function UploadLeadsForm() {
  return (
    <Suspense fallback={<div className="min-h-[200px]" />}>
      <UploadLeadsFormInner />
    </Suspense>
  );
}
