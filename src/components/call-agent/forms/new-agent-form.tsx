"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/lib/constants";
import { CheckCircleIcon, MicIcon } from "@/components/icons";
import { FormField, FormInput, FormSelect, FormTextarea } from "../form-field";

const ROLES = [
  "Sales Outreach",
  "Customer Support",
  "Renewals",
  "Demo Scheduling",
  "Lead Qualification",
] as const;

const VOICE_TONES = [
  { id: "warm", label: "Warm & Professional", description: "Trustworthy and approachable" },
  { id: "energetic", label: "Energetic & Clear", description: "Upbeat and persuasive" },
  { id: "calm", label: "Calm & Helpful", description: "Patient and supportive" },
] as const;

const LANGUAGES = [
  { id: "english", label: "English" },
  { id: "english-hindi", label: "English + Hindi" },
  { id: "english-telugu", label: "English + Telugu" },
  { id: "english-spanish", label: "English + Spanish" },
] as const;

const OPENAI_MODELS = [
  { id: "gpt-4o-realtime-preview", label: "GPT-4o Realtime (Recommended)" },
  { id: "gpt-4o-mini-realtime-preview", label: "GPT-4o Mini Realtime" },
] as const;

const OPENAI_VOICES = [
  { id: "alloy", label: "Alloy" },
  { id: "echo", label: "Echo" },
  { id: "nova", label: "Nova" },
  { id: "shimmer", label: "Shimmer" },
] as const;

export function NewAgentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(ROLES[0]);
  const [voiceTone, setVoiceTone] = useState<string>(VOICE_TONES[0].id);
  const [language, setLanguage] = useState<string>(LANGUAGES[0].id);
  const [model, setModel] = useState<string>(OPENAI_MODELS[0].id);
  const [openaiVoice, setOpenaiVoice] = useState<string>(OPENAI_VOICES[0].id);
  const [temperature, setTemperature] = useState("0.7");
  const [prompt, setPrompt] = useState(
    "You are a professional outbound calling agent. Be warm, concise, and always confirm the customer's identity before proceeding."
  );
  const [businessObjective, setBusinessObjective] = useState(
    "Introduce products, answer questions, and schedule follow-up meetings with interested prospects."
  );
  const [conversationRules, setConversationRules] = useState(
    "Never discuss pricing unless asked. Avoid competitor comparisons. Keep responses under 30 seconds. Always confirm contact details before ending."
  );
  const [greeting, setGreeting] = useState(
    "Hello, this is {agent_name} calling from Dharwin on behalf of {company}. Am I speaking with {contact_name}?"
  );
  const [capabilities, setCapabilities] = useState({
    outbound: true,
    inbound: false,
    voicemail: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.push(`${ROUTES.callAgent}?tab=agents&created=1`);
  };

  const toggleCapability = (key: keyof typeof capabilities) => {
    setCapabilities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 space-y-6">
      <div className="box">
        <div className="box-header">
          <div>
            <h2 className="box-title">Agent profile</h2>
            <p className="box-subtitle">Basic identity and specialty for your AI agent</p>
          </div>
        </div>
        <div className="box-body grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Agent name" hint="This name will be used on calls">
            <FormInput
              id="agent-name"
              placeholder="e.g. Sarah Mitchell"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Role / specialty">
            <FormSelect id="agent-role" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FormSelect>
          </FormField>
        </div>
      </div>

      <div className="box">
        <div className="box-header">
          <div>
            <h2 className="box-title">Voice & language</h2>
            <p className="box-subtitle">How your agent sounds and communicates</p>
          </div>
        </div>
        <div className="box-body space-y-5">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-defaulttextcolor">Voice tone</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {VOICE_TONES.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() => setVoiceTone(tone.id)}
                  className={`rounded-xl border-2 p-4 text-start transition-colors ${
                    voiceTone === tone.id
                      ? "border-brand-green bg-brand-green/5"
                      : "border-defaultborder/60 hover:border-defaultborder"
                  }`}
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                    <MicIcon className="h-4 w-4" />
                  </div>
                  <p
                    className={`m-0 text-sm font-semibold ${
                      voiceTone === tone.id ? "text-brand-green" : "text-defaulttextcolor"
                    }`}
                  >
                    {tone.label}
                  </p>
                  <p className="m-0 mt-1 text-xs text-textmuted">{tone.description}</p>
                </button>
              ))}
            </div>
          </div>

          <FormField label="Languages">
            <FormSelect
              id="agent-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField
            label="Opening greeting"
            hint="Use {agent_name}, {company}, and {contact_name} as placeholders"
          >
            <FormTextarea
              id="agent-greeting"
              rows={3}
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              required
            />
          </FormField>
        </div>
      </div>

      <div className="box">
        <div className="box-header">
          <div>
            <h2 className="box-title">Configuration (Agent Training)</h2>
            <p className="box-subtitle">OpenAI model settings, prompts, and conversation behavior</p>
          </div>
        </div>
        <div className="box-body space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="OpenAI model">
              <FormSelect id="agent-model" value={model} onChange={(e) => setModel(e.target.value)}>
                {OPENAI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label="OpenAI voice">
              <FormSelect
                id="agent-openai-voice"
                value={openaiVoice}
                onChange={(e) => setOpenaiVoice(e.target.value)}
              >
                {OPENAI_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label="Temperature" hint="0 = focused, 1 = creative">
              <FormInput
                id="agent-temp"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Business objective" hint="What this agent should accomplish on calls">
            <FormTextarea
              id="agent-objective"
              rows={2}
              value={businessObjective}
              onChange={(e) => setBusinessObjective(e.target.value)}
              required
            />
          </FormField>

          <FormField label="System prompt" hint="Instructions sent to OpenAI at call start">
            <FormTextarea
              id="agent-prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Conversation rules" hint="Hard constraints the agent must follow">
            <FormTextarea
              id="agent-rules"
              rows={3}
              value={conversationRules}
              onChange={(e) => setConversationRules(e.target.value)}
              required
            />
          </FormField>
        </div>
      </div>

      <div className="box">
        <div className="box-header">
          <div>
            <h2 className="box-title">Capabilities</h2>
            <p className="box-subtitle">Choose what this agent can handle</p>
          </div>
        </div>
        <div className="box-body space-y-3">
          {[
            {
              key: "outbound" as const,
              title: "Outbound calls",
              description: "Place calls to contacts from campaign lists",
            },
            {
              key: "inbound" as const,
              title: "Inbound calls",
              description: "Answer incoming customer calls",
            },
            {
              key: "voicemail" as const,
              title: "Voicemail drop",
              description: "Leave a message when contacts don't answer",
            },
          ].map((item) => (
            <label
              key={item.key}
              className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-colors ${
                capabilities[item.key]
                  ? "border-brand-green bg-brand-green/5"
                  : "border-defaultborder/60 hover:border-defaultborder"
              }`}
            >
              <input
                type="checkbox"
                checked={capabilities[item.key]}
                onChange={() => toggleCapability(item.key)}
                className="mt-1 accent-[var(--brand-green)]"
              />
              <div>
                <p className="m-0 text-sm font-semibold text-defaulttextcolor">{item.title}</p>
                <p className="m-0 mt-0.5 text-sm text-textmuted">{item.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push(`${ROUTES.callAgent}?tab=agents`)}
          className="ti-btn ti-btn-light w-full sm:w-auto"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="ti-btn ti-btn-primary-full w-full gap-2 sm:w-auto disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircleIcon className="h-4 w-4" />
          {isSubmitting ? "Creating…" : "Create agent"}
        </button>
      </div>
    </form>
  );
}
