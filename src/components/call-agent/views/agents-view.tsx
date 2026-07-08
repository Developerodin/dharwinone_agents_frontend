import Link from "next/link";
import { AGENTS } from "@/lib/call-agent-data";
import { ROUTES } from "@/lib/constants";

export function AgentsView() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="m-0 text-lg font-bold tracking-tight text-defaulttextcolor">AI Agents</h2>
          <p className="m-0 mt-1 text-sm text-textmuted">
            Manage AI agents with built-in training and OpenAI configuration
          </p>
        </div>
        <Link href={ROUTES.newAgent} className="ti-btn ti-btn-primary-full ti-btn-sm self-start no-underline">
          + Create Agent
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="box transition-shadow hover:shadow-md">
            <div className="box-body">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green/20 to-brand-green/5 text-sm font-bold text-brand-green">
                    {agent.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="m-0 font-bold text-defaulttextcolor">{agent.name}</h3>
                    <p className="m-0 text-sm text-textmuted">{agent.role}</p>
                  </div>
                </div>
                <span
                  className={`badge ${
                    agent.status === "available"
                      ? "bg-emerald-50 text-emerald-700"
                      : agent.status === "on-call"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {agent.status === "available" ? "Available" : agent.status === "on-call" ? "On Call" : "Away"}
                </span>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-light/80 p-3">
                  <p className="m-0 text-[0.65rem] text-textmuted">Voice</p>
                  <p className="m-0 text-sm font-semibold text-defaulttextcolor">{agent.voice}</p>
                </div>
                <div className="rounded-xl bg-light/80 p-3">
                  <p className="m-0 text-[0.65rem] text-textmuted">Language</p>
                  <p className="m-0 text-sm font-semibold text-defaulttextcolor">{agent.language}</p>
                </div>
                <div className="rounded-xl bg-light/80 p-3">
                  <p className="m-0 text-[0.65rem] text-textmuted">Model</p>
                  <p className="m-0 text-sm font-semibold text-defaulttextcolor">{agent.model}</p>
                </div>
                <div className="rounded-xl bg-light/80 p-3">
                  <p className="m-0 text-[0.65rem] text-textmuted">OpenAI Voice</p>
                  <p className="m-0 text-sm font-semibold capitalize text-defaulttextcolor">{agent.openaiVoice}</p>
                </div>
              </div>

              <div className="mb-5 space-y-2 border-t border-defaultborder/50 pt-4 text-sm">
                <div>
                  <span className="text-textmuted">Objective: </span>
                  <span className="text-defaulttextcolor">{agent.businessObjective}</span>
                </div>
                <div>
                  <span className="text-textmuted">Rules: </span>
                  <span className="text-defaulttextcolor line-clamp-2">{agent.conversationRules}</span>
                </div>
              </div>

              <Link
                href={ROUTES.newCampaign}
                className="ti-btn ti-btn-sm ti-btn-primary w-full no-underline"
              >
                Create Campaign →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
