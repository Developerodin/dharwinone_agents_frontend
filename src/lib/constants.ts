export const ROUTES = {
  signIn: "/sign-in",
  register: "/register",
  forgotPassword: "/forgot-password",
  verify: "/verify",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  callAgent: "/call-agent",
  webAgent: "/web-agent",
  newAgent: "/call-agent/agents/new",
  newCampaign: "/call-agent/campaigns/new",
  uploadLeads: "/call-agent/campaigns/upload-leads",
} as const;

export type WebAgentPageView = "new" | "my-projects" | "deploy-projects" | "workspace";

export const WEB_AGENT_VIEWS: { id: WebAgentPageView; label: string }[] = [
  { id: "new", label: "New project" },
  { id: "my-projects", label: "My Projects" },
  { id: "deploy-projects", label: "Deploy Projects" },
];

export type WorkspaceTab = "preview" | "code" | "deploy" | "info";

export const WORKSPACE_TABS: { id: WorkspaceTab; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "code", label: "Code" },
  { id: "deploy", label: "Deploy" },
  { id: "info", label: "Info" },
];

export type PreviewDevice = "desktop" | "tablet" | "mobile";

export const GENERATION_STAGES = [
  "Understanding your requirements...",
  "Planning the website structure...",
  "Generating UI components...",
  "Creating layouts...",
  "Writing code...",
  "Optimizing design...",
  "Preparing preview...",
  "Finalizing your website...",
] as const;

export const WORKSPACE_GENERATION_MESSAGES = [
  "Building your website...",
  "Creating the layout...",
  "Generating UI components...",
  "Writing the code...",
  "Preparing the live preview...",
] as const;

export type CallAgentTab =
  | "dialer"
  | "agents"
  | "campaigns"
  | "worker"
  | "history"
  | "analytics";

export const CALL_AGENT_TABS: { id: CallAgentTab; label: string }[] = [
  { id: "dialer", label: "Dialer" },
  { id: "agents", label: "Agents" },
  { id: "campaigns", label: "Campaigns" },
  { id: "worker", label: "Live Worker" },
  { id: "history", label: "Call Reports" },
  { id: "analytics", label: "Analytics" },
];
