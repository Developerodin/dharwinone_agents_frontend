export type CallStatus = "completed" | "in-progress" | "failed" | "no-answer" | "scheduled";

export type CampaignStatus = "draft" | "ready" | "active" | "paused" | "completed";

export type WorkerPhase =
  | "idle"
  | "picking-lead"
  | "connecting"
  | "openai-conversation"
  | "generating-report"
  | "next-lead";

export const WORKFLOW_STEPS = [
  { step: 1, title: "Create Agent", description: "Define profile, voice, training & OpenAI settings" },
  { step: 2, title: "Create Campaign", description: "Link agent & set schedule" },
  { step: 3, title: "Upload Leads", description: "Import contact list via CSV/Excel" },
  { step: 4, title: "Start Campaign", description: "Launch automated outbound calling" },
  { step: 5, title: "Worker Picks Lead", description: "Background worker fetches next contact" },
  { step: 6, title: "OpenAI Conversation", description: "AI agent handles the live call" },
  { step: 7, title: "Generate Report", description: "Save transcript, summary & details" },
  { step: 8, title: "Next Lead", description: "Repeat until all leads are contacted" },
] as const;

export const AGENTS = [
  {
    id: "AGT-01",
    name: "Sarah Mitchell",
    role: "Sales Outreach",
    status: "available" as const,
    callsToday: 24,
    language: "English",
    voice: "Warm & Professional",
    model: "gpt-4o-realtime-preview",
    temperature: 0.7,
    maxTokens: 4096,
    openaiVoice: "alloy",
    prompt:
      "Focus on enterprise buyers. Ask discovery questions before presenting features. Goal: book a 30-minute demo.",
    businessObjective: "Introduce enterprise products and schedule qualified demos",
    conversationRules:
      "Mention free trial only if customer shows interest. Never share internal pricing sheets.",
  },
  {
    id: "AGT-02",
    name: "James Kumar",
    role: "Customer Support",
    status: "on-call" as const,
    callsToday: 18,
    language: "English, Hindi",
    voice: "Calm & Helpful",
    model: "gpt-4o-realtime-preview",
    temperature: 0.5,
    maxTokens: 2048,
    openaiVoice: "echo",
    prompt:
      "Triage support calls. Classify issue type, gather account details, and provide resolution or escalation path.",
    businessObjective: "Resolve support inquiries and identify upsell opportunities",
    conversationRules:
      "Do not access account data without verification. Escalate P1 issues immediately.",
  },
  {
    id: "AGT-03",
    name: "Priya Reddy",
    role: "Renewals",
    status: "available" as const,
    callsToday: 31,
    language: "English, Telugu",
    voice: "Friendly & Persuasive",
    model: "gpt-4o-realtime-preview",
    temperature: 0.6,
    maxTokens: 3072,
    openaiVoice: "nova",
    prompt:
      "Remind customers of upcoming renewals. Emphasize ROI and offer loyalty benefits for early renewal.",
    businessObjective: "Secure subscription renewals and reduce churn",
    conversationRules:
      "One retention offer per call. Confirm renewal decision before closing.",
  },
];

export const CAMPAIGNS = [
  {
    id: "CMP-01",
    name: "Q3 Product Outreach",
    purpose: "Introduce new product line and schedule demos",
    status: "active" as CampaignStatus,
    agentId: "AGT-01",
    agent: "Sarah Mitchell",
    totalContacts: 248,
    completed: 142,
    successRate: 68,
    startDate: "Jun 15, 2026",
    leadsUploaded: true,
    callWindow: "Business hours (9 AM – 6 PM)",
  },
  {
    id: "CMP-02",
    name: "Renewal Reminders",
    purpose: "Remind customers about upcoming subscription renewals",
    status: "active" as CampaignStatus,
    agentId: "AGT-03",
    agent: "Priya Reddy",
    totalContacts: 89,
    completed: 56,
    successRate: 72,
    startDate: "Jun 20, 2026",
    leadsUploaded: true,
    callWindow: "Extended (8 AM – 8 PM)",
  },
  {
    id: "CMP-03",
    name: "Support Follow-ups",
    purpose: "Follow up on open support tickets",
    status: "ready" as CampaignStatus,
    agentId: "AGT-02",
    agent: "James Kumar",
    totalContacts: 0,
    completed: 0,
    successRate: 0,
    startDate: "—",
    leadsUploaded: false,
    callWindow: "Business hours (9 AM – 6 PM)",
  },
  {
    id: "CMP-04",
    name: "Demo Booking Blitz",
    purpose: "Schedule product demos with interested leads",
    status: "draft" as CampaignStatus,
    agentId: "AGT-01",
    agent: "Sarah Mitchell",
    totalContacts: 0,
    completed: 0,
    successRate: 0,
    startDate: "—",
    leadsUploaded: false,
    callWindow: "Custom schedule",
  },
];

export const CAMPAIGN_LEADS = [
  { id: "LD-001", name: "John Smith", company: "Acme Corp", phone: "+1 (555) 234-5678", status: "completed" as const },
  { id: "LD-002", name: "Lisa Chen", company: "TechStart Inc", phone: "+1 (555) 876-5432", status: "completed" as const },
  { id: "LD-003", name: "Mark Lee", company: "Global Solutions", phone: "+1 (555) 345-6789", status: "no-answer" as const },
  { id: "LD-004", name: "Anna Wu", company: "Bright Future Ltd", phone: "+1 (555) 456-7890", status: "completed" as const },
  { id: "LD-005", name: "David Park", company: "Nova Retail", phone: "+1 (555) 567-8901", status: "in-progress" as const },
  { id: "LD-006", name: "Emily Torres", company: "Summit Health", phone: "+1 (555) 678-9012", status: "pending" as const },
  { id: "LD-007", name: "Raj Patel", company: "CloudNine Systems", phone: "+1 (555) 789-0123", status: "pending" as const },
  { id: "LD-008", name: "Sophie Martin", company: "GreenLeaf Co", phone: "+1 (555) 890-1234", status: "pending" as const },
];

export const WORKER_DEMO = {
  campaignId: "CMP-01",
  campaignName: "Q3 Product Outreach",
  agentName: "Sarah Mitchell",
  model: "gpt-4o-realtime-preview",
  currentLeadIndex: 4,
  totalLeads: CAMPAIGN_LEADS.length,
};

export const OPENAI_CONVERSATION = [
  { speaker: "agent" as const, text: "Hello, this is Sarah calling from Dharwin on behalf of Acme Corp. Am I speaking with David Park?" },
  { speaker: "customer" as const, text: "Yes, this is David. How can I help you?" },
  { speaker: "agent" as const, text: "Great! I'm reaching out about our new enterprise product line. Do you have a few minutes to discuss how it might benefit Nova Retail?" },
  { speaker: "customer" as const, text: "Sure, I've been looking into solutions like this. What are the key features?" },
  { speaker: "agent" as const, text: "Our platform offers unified workspace management with AI agents that handle drafting, approvals, and reporting. Would you be open to scheduling a demo next Tuesday?" },
  { speaker: "customer" as const, text: "Tuesday works. Let's do 2 PM." },
];

export const CALL_HISTORY = [
  {
    id: "CH-1042",
    customer: "John Smith",
    company: "Acme Corp",
    phone: "+1 (555) 234-5678",
    agent: "Sarah Mitchell",
    campaign: "Q3 Product Outreach",
    status: "completed" as CallStatus,
    duration: "12:34",
    outcome: "Follow-up scheduled",
    sentiment: "Positive",
    date: "Jul 2, 2026 · 11:42 AM",
    recordingUrl: "#",
    followUp: "Demo scheduled for Jul 8 at 2:00 PM",
    aiSummary:
      "Sarah introduced the enterprise product line to John, who had already been evaluating similar solutions. He asked about key features and agreed to a demo next Tuesday at 2 PM — positive sentiment throughout.",
    transcript: [
      { speaker: "agent" as const, text: "Hello John, this is Sarah from Dharwin. Do you have a moment to discuss our enterprise platform?" },
      { speaker: "customer" as const, text: "Yes, I've been researching options. Tell me more." },
      { speaker: "agent" as const, text: "Our AI-powered workspace handles drafting, approvals, and reporting. Would Tuesday at 2 PM work for a demo?" },
      { speaker: "customer" as const, text: "That works perfectly. Send me a calendar invite." },
    ],
  },
  {
    id: "CH-1041",
    customer: "Lisa Chen",
    company: "TechStart Inc",
    phone: "+1 (555) 876-5432",
    agent: "James Kumar",
    campaign: "Support Follow-ups",
    status: "completed" as CallStatus,
    duration: "08:21",
    outcome: "Issue resolved",
    sentiment: "Neutral",
    date: "Jul 2, 2026 · 11:24 AM",
    recordingUrl: "#",
    followUp: "Ticket #4821 closed — no further action",
    aiSummary:
      "James resolved Lisa's billing inquiry and confirmed her account upgrade. Neutral tone overall; customer satisfied with resolution.",
    transcript: [
      { speaker: "agent" as const, text: "Hi Lisa, I'm calling regarding your open support ticket about billing." },
      { speaker: "customer" as const, text: "Yes, I was charged twice last month." },
      { speaker: "agent" as const, text: "I've reviewed your account and initiated a refund for the duplicate charge. You'll see it in 3–5 business days." },
      { speaker: "customer" as const, text: "Thank you, that resolves my concern." },
    ],
  },
  {
    id: "CH-1040",
    customer: "Mark Lee",
    company: "Global Solutions",
    phone: "+1 (555) 345-6789",
    agent: "Priya Reddy",
    campaign: "Renewal Reminders",
    status: "no-answer" as CallStatus,
    duration: "00:45",
    outcome: "No answer — retry scheduled",
    sentiment: "—",
    date: "Jul 2, 2026 · 10:58 AM",
    recordingUrl: "",
    followUp: "Auto-retry scheduled for Jul 3 at 10:00 AM",
    aiSummary:
      "Call rang for 45 seconds with no answer. Worker queued automatic retry per campaign rules. No conversation transcript available.",
    transcript: [],
  },
  {
    id: "CH-1039",
    customer: "Anna Wu",
    company: "Bright Future Ltd",
    phone: "+1 (555) 456-7890",
    agent: "Sarah Mitchell",
    campaign: "Q3 Product Outreach",
    status: "completed" as CallStatus,
    duration: "22:10",
    outcome: "Demo booked",
    sentiment: "Positive",
    date: "Jul 2, 2026 · 10:15 AM",
    recordingUrl: "#",
    followUp: "Demo confirmed — send product one-pager",
    aiSummary:
      "Anna was highly engaged over a 22-minute call. She asked implementation questions and confirmed a demo slot. Strong positive sentiment at close.",
    transcript: [
      { speaker: "agent" as const, text: "Hi Anna, I'm Sarah from Dharwin reaching out about our enterprise suite." },
      { speaker: "customer" as const, text: "We need something that integrates with our existing CRM." },
      { speaker: "agent" as const, text: "We support Salesforce, HubSpot, and custom API integrations. Shall I walk you through a live demo?" },
      { speaker: "customer" as const, text: "Yes, book me for Thursday morning." },
    ],
  },
  {
    id: "CH-1038",
    customer: "David Park",
    company: "Nova Retail",
    phone: "+1 (555) 567-8901",
    agent: "Sarah Mitchell",
    campaign: "Q3 Product Outreach",
    status: "in-progress" as CallStatus,
    duration: "04:32",
    outcome: "Call in progress",
    sentiment: "—",
    date: "Jul 2, 2026 · 11:55 AM",
    recordingUrl: "#",
    followUp: "—",
    aiSummary:
      "Worker connected OpenAI Realtime to David Park. Conversation is active — report will generate when the call ends.",
    transcript: OPENAI_CONVERSATION.slice(0, 4),
  },
];

export const ANALYTICS_STATS = [
  { label: "Total Calls", value: "1,284", change: "+12.4%", trend: "up" as const },
  { label: "Success Rate", value: "72.8%", change: "+3.2%", trend: "up" as const },
  { label: "Avg. Duration", value: "5m 18s", change: "-0.8%", trend: "down" as const },
  { label: "Active Campaigns", value: "2", change: "0", trend: "neutral" as const },
];
