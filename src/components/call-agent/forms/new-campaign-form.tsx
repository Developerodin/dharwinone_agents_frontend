"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AGENTS } from "@/lib/call-agent-data";
import { ROUTES } from "@/lib/constants";
import { CheckCircleIcon } from "@/components/icons";
import { FormField, FormInput, FormSelect, FormTextarea } from "../form-field";

const OBJECTIVES = [
  "Schedule a demo or meeting",
  "Qualify leads and gather interest",
  "Renewal reminders",
  "Customer support follow-up",
  "Product introduction",
] as const;

export function NewCampaignForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [agentId, setAgentId] = useState(AGENTS[0]?.id ?? "");
  const [objective, setObjective] = useState<string>(OBJECTIVES[0]);
  const [startDate, setStartDate] = useState("");
  const [maxRetries, setMaxRetries] = useState("3");
  const [callWindow, setCallWindow] = useState("business");
  const [notes, setNotes] = useState("");

  const selectedAgent = AGENTS.find((a) => a.id === agentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.push(`${ROUTES.uploadLeads}?campaign=CMP-NEW`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 space-y-6">
      <div className="box">
        <div className="box-header">
          <div>
            <h2 className="box-title">Campaign details</h2>
            <p className="box-subtitle">Name your campaign and define its purpose</p>
          </div>
        </div>
        <div className="box-body grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Campaign name" hint="Use a clear name your team will recognize">
            <FormInput
              id="campaign-name"
              placeholder="e.g. Q3 Product Outreach"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Primary objective">
            <FormSelect
              id="campaign-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            >
              {OBJECTIVES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <div className="md:col-span-2">
            <FormField
              label="Campaign purpose"
              hint="Describe what the AI agent should accomplish on each call"
            >
              <FormTextarea
                id="campaign-purpose"
                rows={3}
                placeholder="Introduce our new enterprise product line, answer questions, and schedule demos with interested prospects..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>
      </div>

      <div className="box">
        <div className="box-header">
          <div>
            <h2 className="box-title">AI agent</h2>
            <p className="box-subtitle">Select the trained agent that powers this campaign</p>
          </div>
        </div>
        <div className="box-body space-y-5">
          <FormField label="Agent">
            <FormSelect
              id="campaign-agent"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              required
            >
              {AGENTS.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} — {agent.role}
                </option>
              ))}
            </FormSelect>
          </FormField>

          {selectedAgent && (
            <div className="rounded-xl border border-defaultborder/50 bg-light/60 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-textmuted">OpenAI Model</span>
                <span className="font-semibold text-defaulttextcolor">{selectedAgent.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textmuted">Voice</span>
                <span className="font-semibold capitalize text-defaulttextcolor">{selectedAgent.openaiVoice}</span>
              </div>
              <div>
                <span className="text-textmuted">Prompt: </span>
                <span className="text-defaulttextcolor">{selectedAgent.prompt}</span>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-brand-green/20 bg-brand-green/5 p-4 text-sm">
            <p className="m-0 font-semibold text-defaulttextcolor">Next step: Upload leads</p>
            <p className="m-0 mt-1 text-textmuted">
              After creating the campaign, you will upload your contact list (CSV/Excel) before starting.
            </p>
          </div>
        </div>
      </div>

      <div className="box">
        <div className="box-header">
          <div>
            <h2 className="box-title">Schedule & rules</h2>
            <p className="box-subtitle">Control when and how calls are placed</p>
          </div>
        </div>
        <div className="box-body grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Start date">
            <FormInput
              id="campaign-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Calling window">
            <FormSelect
              id="campaign-window"
              value={callWindow}
              onChange={(e) => setCallWindow(e.target.value)}
            >
              <option value="business">Business hours (9 AM – 6 PM)</option>
              <option value="extended">Extended (8 AM – 8 PM)</option>
              <option value="custom">Custom schedule</option>
            </FormSelect>
          </FormField>

          <FormField label="Max retry attempts" hint="Per contact if no answer">
            <FormSelect
              id="campaign-retries"
              value={maxRetries}
              onChange={(e) => setMaxRetries(e.target.value)}
            >
              <option value="1">1 retry</option>
              <option value="2">2 retries</option>
              <option value="3">3 retries</option>
              <option value="5">5 retries</option>
            </FormSelect>
          </FormField>

          <div className="sm:col-span-2 lg:col-span-3">
            <FormField label="Additional notes" hint="Optional context for the agent">
              <FormTextarea
                id="campaign-notes"
                rows={2}
                placeholder="Mention pricing only if asked. Avoid discussing competitor products..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" className="ti-btn ti-btn-light w-full sm:w-auto">
            Save as draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="ti-btn ti-btn-primary-full w-full gap-2 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircleIcon className="h-4 w-4" />
            {isSubmitting ? "Creating…" : "Create & upload leads"}
          </button>
        </div>
      </div>
    </form>
  );
}
