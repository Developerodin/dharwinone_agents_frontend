import { ANALYTICS_STATS, CALL_HISTORY } from "@/lib/call-agent-data";
import { TrendUpIcon } from "@/components/icons";

const CHART_BARS = [65, 78, 52, 88, 72, 95, 68, 82, 74, 90, 85, 79];

export function AnalyticsView() {
  const statusCounts = {
    completed: CALL_HISTORY.filter((c) => c.status === "completed").length,
    "in-progress": CALL_HISTORY.filter((c) => c.status === "in-progress").length,
    "no-answer": CALL_HISTORY.filter((c) => c.status === "no-answer").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ANALYTICS_STATS.map((stat) => (
          <div key={stat.label} className="box">
            <div className="box-body">
              <p className="text-xs font-semibold text-textmuted uppercase tracking-wide m-0 mb-2">{stat.label}</p>
              <div className="flex items-end justify-between gap-2">
                <p className="text-2xl font-bold text-defaulttextcolor m-0 tracking-tight">{stat.value}</p>
                {stat.trend !== "neutral" && (
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${stat.trend === "up" ? "text-emerald-600" : "text-red-500"}`}>
                    <TrendUpIcon className={`w-3 h-3 ${stat.trend === "down" ? "rotate-180" : ""}`} />
                    {stat.change}
                  </span>
                )}
              </div>
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
                {CHART_BARS.map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full max-w-[28px] rounded-t-lg bg-brand-green/80 hover:bg-brand-green transition-colors"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[0.6rem] text-textmuted font-medium">
                      {["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F"][i]}
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
                { label: "Completed", count: statusCounts.completed, color: "bg-emerald-500", pct: 60 },
                { label: "In Progress", count: statusCounts["in-progress"], color: "bg-blue-500", pct: 20 },
                { label: "No Answer", count: statusCounts["no-answer"], color: "bg-amber-500", pct: 20 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-defaulttextcolor font-semibold">{item.label}</span>
                    <span className="text-textmuted">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-light overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}

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
