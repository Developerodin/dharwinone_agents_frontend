"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CAMPAIGNS } from "@/lib/call-agent-data";
import { ROUTES } from "@/lib/constants";
import { DownloadIcon, PlayIcon } from "@/components/icons";

const STATUS_CONFIG = {
  draft: { label: "Draft", class: "bg-slate-100 text-slate-600" },
  ready: { label: "Ready", class: "bg-blue-50 text-blue-700" },
  active: { label: "Active", class: "bg-emerald-50 text-emerald-700" },
  paused: { label: "Paused", class: "bg-amber-50 text-amber-700" },
  completed: { label: "Completed", class: "bg-violet-50 text-violet-700" },
} as const;

export function CampaignsView() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold tracking-tight text-defaulttextcolor">Campaigns</h2>
          <p className="m-0 mt-1 text-sm text-textmuted">
            Create campaigns, upload leads, and manage outbound calling
          </p>
        </div>
        <Link href={ROUTES.newCampaign} className="ti-btn ti-btn-primary-full ti-btn-sm self-start no-underline">
          + New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {CAMPAIGNS.map((campaign) => {
          const progress =
            campaign.totalContacts > 0
              ? Math.round((campaign.completed / campaign.totalContacts) * 100)
              : 0;
          const status = STATUS_CONFIG[campaign.status];

          return (
            <div key={campaign.id} className="box transition-shadow hover:shadow-md">
              <div className="box-body space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <h3 className="m-0 font-bold text-defaulttextcolor">{campaign.name}</h3>
                      <span className={`badge ${status.class}`}>{status.label}</span>
                      {!campaign.leadsUploaded && (
                        <span className="badge bg-amber-50 text-amber-700">Leads pending</span>
                      )}
                    </div>
                    <p className="m-0 text-sm leading-relaxed text-textmuted">{campaign.purpose}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-defaultborder/50 bg-light/80 p-3 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-textmuted">Agent</span>
                    <span className="font-semibold text-defaulttextcolor">{campaign.agent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textmuted">Call window</span>
                    <span className="font-semibold text-defaulttextcolor">{campaign.callWindow}</span>
                  </div>
                </div>

                {campaign.totalContacts > 0 && (
                  <div>
                    <div className="mb-2 flex justify-between text-xs text-textmuted">
                      <span>
                        {campaign.completed} / {campaign.totalContacts} leads contacted
                      </span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-light">
                      <div
                        className="h-full rounded-full bg-brand-green transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl bg-light/60 p-2 text-center">
                    <p className="m-0 text-lg font-bold text-defaulttextcolor">{campaign.successRate}%</p>
                    <p className="m-0 text-[0.65rem] text-textmuted">Success</p>
                  </div>
                  <div className="rounded-xl bg-light/60 p-2 text-center">
                    <p className="m-0 text-sm font-bold text-defaulttextcolor">{campaign.startDate}</p>
                    <p className="m-0 text-[0.65rem] text-textmuted">Started</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {!campaign.leadsUploaded ? (
                    <Link
                      href={`${ROUTES.uploadLeads}?campaign=${campaign.id}`}
                      className="ti-btn ti-btn-sm ti-btn-primary flex-1 gap-1.5 no-underline"
                    >
                      <DownloadIcon className="h-3.5 w-3.5" />
                      Upload Leads
                    </Link>
                  ) : campaign.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => router.push(`${ROUTES.callAgent}?tab=worker`)}
                      className="ti-btn ti-btn-sm ti-btn-primary flex-1 gap-1.5"
                    >
                      <PlayIcon className="h-3.5 w-3.5" />
                      View Worker
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push(`${ROUTES.callAgent}?tab=worker`)}
                      className="ti-btn ti-btn-sm ti-btn-primary flex-1 gap-1.5"
                    >
                      <PlayIcon className="h-3.5 w-3.5" />
                      Start Campaign
                    </button>
                  )}
                  <Link
                    href={`${ROUTES.uploadLeads}?campaign=${campaign.id}`}
                    className="ti-btn ti-btn-sm ti-btn-light no-underline"
                  >
                    Leads
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
