"use client";

import { useCallRecords } from "@/hooks/use-call-records";
import { toUiStatus, formatDuration } from "@/components/call-agent/views/track-history-view";

export function AnalyticsView() {
  const { records } = useCallRecords();
  const calls = records ?? [];

  const statusCounts = {
    completed: calls.filter((c) => toUiStatus(c.status) === "completed").length,
    "in-progress": calls.filter((c) => toUiStatus(c.status) === "in-progress").length,
    "no-answer": calls.filter((c) => toUiStatus(c.status) === "no-answer").length,
    failed: calls.filter((c) => toUiStatus(c.status) === "failed").length,
  };
  const total = calls.length;
  const callsWithDuration = calls.filter((c) => c.duration != null);
  const avgDuration = callsWithDuration.length
    ? Math.round(callsWithDuration.reduce((sum, c) => sum + (c.duration ?? 0), 0) / callsWithDuration.length)
    : 0;
  const successRate = total ? Math.round((statusCounts.completed / total) * 100) : 0;

  const stats = [
    { label: "Total Calls", value: String(total) },
    { label: "Completed", value: String(statusCounts.completed) },
    { label: "Avg. Duration", value: formatDuration(avgDuration) },
    { label: "Success Rate", value: `${successRate}%` },
  ];

  // Call volume per day, last 12 days (oldest → newest).
  const days = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (11 - i));
    return d;
  });
  const volume = days.map(
    (day) =>
      calls.filter((c) => {
        const t = new Date(c.createdAt);
        return (
          t.getFullYear() === day.getFullYear() &&
          t.getMonth() === day.getMonth() &&
          t.getDate() === day.getDate()
        );
      }).length,
  );
  const maxVolume = Math.max(...volume, 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="box">
            <div className="box-body">
              <p className="text-xs font-semibold text-textmuted uppercase tracking-wide m-0 mb-2">{stat.label}</p>
              <p className="text-2xl font-bold text-defaulttextcolor m-0 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="box h-full">
            <div className="box-header">
              <div>
                <h2 className="box-title">Call Volume</h2>
                <p className="box-subtitle">Last 12 days</p>
              </div>
              <select className="text-sm border border-defaultborder rounded-xl px-3 py-2 bg-white text-defaulttextcolor outline-none focus:border-brand-green">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            </div>
            <div className="box-body">
              <div className="flex items-end justify-between gap-2 h-48 px-2">
                {volume.map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full max-w-[28px] rounded-t-lg bg-brand-green/80 hover:bg-brand-green transition-colors"
                      style={{ height: `${Math.max((count / maxVolume) * 100, count ? 8 : 2)}%` }}
                      title={`${count} call${count === 1 ? "" : "s"}`}
                    />
                    <span className="text-[0.6rem] text-textmuted font-medium">
                      {days[i].toLocaleDateString(undefined, { weekday: "narrow" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="box h-full">
            <div className="box-header">
              <h2 className="box-title">Call Status</h2>
            </div>
            <div className="box-body space-y-4">
              {[
                { label: "Completed", count: statusCounts.completed, color: "bg-emerald-500" },
                { label: "In Progress", count: statusCounts["in-progress"], color: "bg-blue-500" },
                { label: "No Answer", count: statusCounts["no-answer"], color: "bg-amber-500" },
                { label: "Failed", count: statusCounts.failed, color: "bg-red-500" },
              ].map((item) => {
                const pct = total ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-defaulttextcolor font-semibold">{item.label}</span>
                      <span className="text-textmuted">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-light overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t border-defaultborder/50 space-y-3">
                <h3 className="text-sm font-bold text-defaulttextcolor m-0">Top Campaigns</h3>
                {["Q2 Product Outreach", "Inbound Support", "Renewal Reminders"].map((name, i) => (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="text-defaulttextcolor">{name}</span>
                    <span className="text-textmuted font-semibold">{[142, 298, 56][i]} calls</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12">
          <div className="box">
            <div className="box-header">
              <div>
                <h2 className="box-title">Agent Performance</h2>
                <p className="box-subtitle">Success rates and call metrics by agent</p>
              </div>
            </div>
            <div className="box-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-defaultborder/60 text-textmuted bg-light/60">
                      <th className="text-start font-semibold px-6 py-3.5 text-xs uppercase tracking-wide">Agent</th>
                      <th className="text-start font-semibold px-6 py-3.5 text-xs uppercase tracking-wide">Calls</th>
                      <th className="text-start font-semibold px-6 py-3.5 text-xs uppercase tracking-wide">Avg. Duration</th>
                      <th className="text-start font-semibold px-6 py-3.5 text-xs uppercase tracking-wide">Success Rate</th>
                      <th className="text-start font-semibold px-6 py-3.5 text-xs uppercase tracking-wide">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Sarah Mitchell", calls: 142, duration: "4m 12s", rate: 71, sentiment: "Positive" },
                      { name: "James Kumar", calls: 298, duration: "6m 45s", rate: 84, sentiment: "Neutral" },
                      { name: "Priya Reddy", calls: 56, duration: "3m 58s", rate: 69, sentiment: "Positive" },
                      { name: "Alex Thompson", calls: 78, duration: "5m 22s", rate: 63, sentiment: "Mixed" },
                    ].map((row) => (
                      <tr key={row.name} className="border-b border-defaultborder/40 last:border-0 hover:bg-light/50">
                        <td className="px-6 py-4 font-semibold text-defaulttextcolor">{row.name}</td>
                        <td className="px-6 py-4">{row.calls}</td>
                        <td className="px-6 py-4 text-textmuted">{row.duration}</td>
                        <td className="px-6 py-4">
                          <span className="badge bg-emerald-50 text-emerald-700">{row.rate}%</span>
                        </td>
                        <td className="px-6 py-4 text-defaulttextcolor">{row.sentiment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
