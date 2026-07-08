"use client";

import type { DeploymentRecord } from "@/lib/web-agent-data";
import { ExternalLinkIcon, RocketIcon } from "@/components/icons";

type DeploymentsViewProps = {
  deployments: DeploymentRecord[];
};

const STATUS_CONFIG: Record<DeploymentRecord["status"], { label: string; className: string; dot: string }> = {
  building: { label: "Building", className: "status-in-progress", dot: "bg-blue-500" },
  deploying: { label: "Deploying", className: "status-in-progress", dot: "bg-blue-500" },
  live: { label: "Live", className: "status-completed", dot: "bg-emerald-500" },
  failed: { label: "Failed", className: "status-failed", dot: "bg-red-500" },
};

function formatDuration(start: string, end?: string): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export function DeploymentsView({ deployments }: DeploymentsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="m-0 text-lg font-bold tracking-tight text-defaulttextcolor">Deployment History</h2>
        <p className="m-0 mt-1 text-sm text-textmuted">
          Track all website deployments and their status
        </p>
      </div>

      {deployments.length === 0 ? (
        <div className="box">
          <div className="box-body flex flex-col items-center py-16 text-center">
            <RocketIcon className="h-12 w-12 text-textmuted/30" />
            <h3 className="mt-4 text-base font-semibold text-defaulttextcolor">No deployments yet</h3>
            <p className="mt-1 text-sm text-textmuted">Deploy a project to see it here</p>
          </div>
        </div>
      ) : (
        <div className="box overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-defaultborder/60 bg-light/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">Deployed</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-textmuted">URL</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((dep, i) => {
                  const status = STATUS_CONFIG[dep.status];
                  return (
                    <tr
                      key={dep.id}
                      className="border-b border-defaultborder/40 transition-colors hover:bg-light/30"
                      style={{ animation: `wa-fade-up 0.3s ease-out ${i * 0.05}s both` }}
                    >
                      <td className="px-6 py-4 font-medium text-defaulttextcolor">{dep.projectName}</td>
                      <td className="px-6 py-4 text-textmuted">{dep.version}</td>
                      <td className="px-6 py-4">
                        <span className={`badge ${status.className} gap-1.5`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-textmuted">{formatDuration(dep.startedAt, dep.completedAt)}</td>
                      <td className="px-6 py-4 text-textmuted">
                        {new Date(dep.startedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-6 py-4">
                        {dep.url ? (
                          <a
                            href={dep.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-green hover:underline"
                          >
                            {dep.url.replace("https://", "")}
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-textmuted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
