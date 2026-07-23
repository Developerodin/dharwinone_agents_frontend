export type WebProjectStatus = "draft" | "generated" | "deployed" | "generating";

export type ChatAttachmentKind = "image" | "pdf";

export type ChatAttachment = {
  id: string;
  name: string;
  kind: ChatAttachmentKind;
  mimeType: string;
  size: number;
  url: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  questionId?: GatheringQuestionId;
  questionOptions?: QuestionnaireOption[];
  otherPlaceholder?: string;
};

export type WebsiteVersion = {
  id: string;
  label: string;
  createdAt: string;
  prompt: string;
  html: string;
  css: string;
  js: string;
};

export type WebsiteQuestionnaireAnswer = {
  value: string;
  otherText?: string;
};

export type WebsiteQuestionnaire = {
  initialPrompt: string;
  websiteName: string;
  websiteType: WebsiteQuestionnaireAnswer;
  style: WebsiteQuestionnaireAnswer;
  features: WebsiteQuestionnaireAnswer;
  additionalRequirements: WebsiteQuestionnaireAnswer;
};

export type GatheringQuestionId =
  | "websiteName"
  | "websiteType"
  | "style"
  | "features"
  | "additionalRequirements";

export type GatheringQuestion = {
  id: GatheringQuestionId;
  question: string;
  inputType: "text" | "choice";
  options?: QuestionnaireOption[];
  otherPlaceholder?: string;
};

export const GATHERING_QUESTIONS: GatheringQuestion[] = [
  {
    id: "websiteName",
    question: "What is the name of your website?",
    inputType: "text",
  },
  {
    id: "websiteType",
    question: "What type of website do you want?",
    inputType: "choice",
    options: [
      { id: "ecommerce", label: "E-commerce" },
      { id: "portfolio", label: "Portfolio" },
      { id: "business", label: "Business" },
      { id: "blog", label: "Blog" },
      { id: "other", label: "Other" },
    ],
    otherPlaceholder: "Describe your website type",
  },
  {
    id: "style",
    question: "What design style do you prefer?",
    inputType: "choice",
    options: [
      { id: "modern", label: "Modern" },
      { id: "minimal", label: "Minimal" },
      { id: "professional", label: "Professional" },
      { id: "creative", label: "Creative" },
      { id: "other", label: "Other" },
    ],
    otherPlaceholder: "Describe your preferred style",
  },
  {
    id: "features",
    question: "What features do you need?",
    inputType: "choice",
    options: [
      { id: "user-login", label: "User login" },
      { id: "payment", label: "Payment integration" },
      { id: "dashboard", label: "Dashboard" },
      { id: "contact-form", label: "Contact form" },
      { id: "other", label: "Other" },
    ],
    otherPlaceholder: "Enter your custom requirements",
  },
  {
    id: "additionalRequirements",
    question: "Any additional requirements?",
    inputType: "choice",
    options: [
      { id: "animations", label: "Add animations" },
      { id: "responsive", label: "Mobile responsive" },
      { id: "seo", label: "SEO optimization" },
      { id: "custom-design", label: "Custom design" },
      { id: "other", label: "Other" },
    ],
    otherPlaceholder: "Enter your requirements",
  },
];

export const GATHERING_CHOICE_QUESTIONS = GATHERING_QUESTIONS.filter((q) => q.inputType === "choice");

export type QuestionnaireOption = {
  id: string;
  label: string;
};

export function getGatheringQuestion(id: GatheringQuestionId): GatheringQuestion {
  return GATHERING_QUESTIONS.find((q) => q.id === id)!;
}

export function formatGatheringAnswer(
  questionId: GatheringQuestionId,
  answer: string | WebsiteQuestionnaireAnswer
): string {
  if (questionId === "websiteName") return String(answer);

  const question = getGatheringQuestion(questionId);
  const choice = answer as WebsiteQuestionnaireAnswer;
  if (choice.value === "other" && choice.otherText?.trim()) {
    return choice.otherText.trim();
  }
  return question.options?.find((o) => o.id === choice.value)?.label ?? choice.value;
}

export function formatQuestionnaireAnswer(answer: WebsiteQuestionnaireAnswer, options: QuestionnaireOption[]): string {
  if (answer.value === "other" && answer.otherText?.trim()) {
    return answer.otherText.trim();
  }
  return options.find((o) => o.id === answer.value)?.label ?? answer.value;
}

export function composeFullPrompt(initialPrompt: string, questionnaire: WebsiteQuestionnaire): string {
  const typeQ = getGatheringQuestion("websiteType");
  const styleQ = getGatheringQuestion("style");
  const featuresQ = getGatheringQuestion("features");
  const additionalQ = getGatheringQuestion("additionalRequirements");

  const parts = [
    initialPrompt,
    `Website name: "${questionnaire.websiteName}".`,
    `Type: ${formatQuestionnaireAnswer(questionnaire.websiteType, typeQ.options!)}.`,
    `Style: ${formatQuestionnaireAnswer(questionnaire.style, styleQ.options!)}.`,
    `Features: ${formatQuestionnaireAnswer(questionnaire.features, featuresQ.options!)}.`,
    `Additional requirements: ${formatQuestionnaireAnswer(questionnaire.additionalRequirements, additionalQ.options!)}.`,
  ];

  return parts.join(" ");
}

export type WebProjectKind = "site" | "builder";

export type WebProject = {
  id: string;
  name: string;
  description: string;
  status: WebProjectStatus;
  kind: WebProjectKind;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  deployedUrl?: string;
  siteId?: string;
  subdomain?: string;
  templateId?: string;
  family?: import("@/lib/sites-types").FamilyId;
  previewVersion?: number;
  versions: WebsiteVersion[];
  chatHistory: ChatMessage[];
  uploadedAssets: string[];
  questionnaire?: WebsiteQuestionnaire;
};

export type DeploymentRecord = {
  id: string;
  projectId: string;
  projectName: string;
  status: "building" | "deploying" | "live" | "failed";
  url?: string;
  startedAt: string;
  completedAt?: string;
  version: string;
};

export const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verdant Studio — Creative Agency</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <nav class="nav">
    <div class="logo">Verdant<span>Studio</span></div>
    <ul class="nav-links">
      <li><a href="#work">Work</a></li>
      <li><a href="#services">Services</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#contact" class="btn-nav">Get in touch</a></li>
    </ul>
  </nav>

  <header class="hero">
    <div class="hero-badge">Award-winning creative studio</div>
    <h1>We craft digital experiences that <em>inspire</em></h1>
    <p>Strategy, design, and development for brands ready to stand out in a crowded world.</p>
    <div class="hero-cta">
      <a href="#work" class="btn-primary">View our work</a>
      <a href="#contact" class="btn-secondary">Start a project</a>
    </div>
    <div class="hero-stats">
      <div><strong>120+</strong><span>Projects delivered</span></div>
      <div><strong>48</strong><span>Happy clients</span></div>
      <div><strong>12</strong><span>Industry awards</span></div>
    </div>
  </header>

  <section id="work" class="section work">
    <h2>Selected work</h2>
    <div class="grid">
      <article class="card"><div class="card-img c1"></div><h3>Northwind Rebrand</h3><p>Brand identity & web</p></article>
      <article class="card"><div class="card-img c2"></div><h3>Lumina App</h3><p>Product design & dev</p></article>
      <article class="card"><div class="card-img c3"></div><h3>EcoFlow Platform</h3><p>E-commerce experience</p></article>
    </div>
  </section>

  <section id="contact" class="section contact">
    <h2>Let's build something remarkable</h2>
    <form class="contact-form">
      <input type="text" placeholder="Your name" />
      <input type="email" placeholder="Email address" />
      <textarea placeholder="Tell us about your project"></textarea>
      <button type="submit">Send message</button>
    </form>
  </section>

  <footer class="footer">
    <p>&copy; 2026 Verdant Studio. Crafted with care.</p>
  </footer>
  <script src="script.js"></script>
</body>
</html>`;

export const SAMPLE_CSS = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', system-ui, sans-serif; color: #111; background: #fafafa; line-height: 1.6; }
.nav { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 2rem; background: #fff; border-bottom: 1px solid #eee; position: sticky; top: 0; z-index: 10; }
.logo { font-size: 1.25rem; font-weight: 700; }
.logo span { color: #41a454; }
.nav-links { display: flex; gap: 2rem; list-style: none; align-items: center; }
.nav-links a { text-decoration: none; color: #444; font-size: 0.9rem; transition: color 0.2s; }
.nav-links a:hover { color: #41a454; }
.btn-nav { background: #41a454; color: #fff !important; padding: 0.5rem 1.25rem; border-radius: 8px; }
.hero { text-align: center; padding: 6rem 2rem 4rem; max-width: 800px; margin: 0 auto; }
.hero-badge { display: inline-block; background: #ecfdf3; color: #41a454; padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 1.5rem; }
.hero h1 { font-size: 3rem; font-weight: 800; line-height: 1.15; margin-bottom: 1rem; }
.hero h1 em { font-style: normal; color: #41a454; }
.hero p { font-size: 1.15rem; color: #666; margin-bottom: 2rem; }
.hero-cta { display: flex; gap: 1rem; justify-content: center; margin-bottom: 3rem; }
.btn-primary { background: #41a454; color: #fff; padding: 0.85rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 600; }
.btn-secondary { border: 1px solid #ddd; color: #333; padding: 0.85rem 2rem; border-radius: 10px; text-decoration: none; font-weight: 600; }
.hero-stats { display: flex; gap: 3rem; justify-content: center; }
.hero-stats strong { display: block; font-size: 1.75rem; color: #41a454; }
.hero-stats span { font-size: 0.85rem; color: #888; }
.section { padding: 4rem 2rem; max-width: 1100px; margin: 0 auto; }
.section h2 { font-size: 2rem; margin-bottom: 2rem; text-align: center; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); transition: transform 0.3s; }
.card:hover { transform: translateY(-4px); }
.card-img { height: 180px; }
.c1 { background: linear-gradient(135deg, #41a454, #1b3a5c); }
.c2 { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.c3 { background: linear-gradient(135deg, #f59e0b, #ef4444); }
.card h3 { padding: 1rem 1rem 0.25rem; font-size: 1.1rem; }
.card p { padding: 0 1rem 1rem; color: #888; font-size: 0.9rem; }
.contact { background: #fff; border-radius: 24px; margin: 2rem auto; max-width: 600px; text-align: center; }
.contact-form { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem; }
.contact-form input, .contact-form textarea { padding: 0.85rem 1rem; border: 1px solid #e5e5e5; border-radius: 10px; font-size: 0.95rem; }
.contact-form button { background: #41a454; color: #fff; border: none; padding: 0.85rem; border-radius: 10px; font-weight: 600; cursor: pointer; }
.footer { text-align: center; padding: 2rem; color: #999; font-size: 0.85rem; }`;

export const SAMPLE_JS = `// Verdant Studio — interactive enhancements
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

document.querySelector('.contact-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Thanks! We\\'ll be in touch soon.');
});

// Subtle scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .hero-stats > div').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s, transform 0.6s';
  observer.observe(el);
});`;

function createVersion(id: string, label: string, prompt: string, daysAgo: number): WebsiteVersion {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id,
    label,
    createdAt: date.toISOString(),
    prompt,
    html: SAMPLE_HTML,
    css: SAMPLE_CSS,
    js: SAMPLE_JS,
  };
}

export const INITIAL_PROJECTS: WebProject[] = [
  {
    id: "proj-1",
    name: "Verdant Studio",
    description: "Creative agency landing page with portfolio grid",
    status: "deployed",
    kind: "builder",
    prompt: "Build a modern creative agency website with a hero section, portfolio grid, and contact form. Use green accents and clean typography.",
    createdAt: "2026-06-28T10:00:00Z",
    updatedAt: "2026-07-05T14:30:00Z",
    deployedUrl: "https://verdant-studio.dharwin.app",
    uploadedAssets: ["logo-sketch.png", "hero-bg.jpg"],
    versions: [
      createVersion("v1-1", "v1 — Initial", "Build a modern creative agency website...", 7),
      createVersion("v1-2", "v2 — Refined hero", "Make the hero section more bold with larger typography", 5),
      createVersion("v1-3", "v3 — Current", "Add portfolio cards with hover effects and stats section", 2),
    ],
    chatHistory: [
      { id: "c1", role: "user", content: "Build a modern creative agency website with a hero section, portfolio grid, and contact form.", timestamp: "2026-06-28T10:00:00Z" },
      { id: "c2", role: "assistant", content: "I've created a polished agency landing page with a sticky navigation, bold hero with stats, a 3-column portfolio grid, and a contact form. The design uses your brand green (#41a454) as the primary accent.", timestamp: "2026-06-28T10:02:00Z" },
      { id: "c3", role: "user", content: "Make the hero section more bold with larger typography", timestamp: "2026-07-03T09:15:00Z" },
      { id: "c4", role: "assistant", content: "Done! I've increased the hero heading to 3rem with tighter line-height and added an award badge above the title for extra visual impact.", timestamp: "2026-07-03T09:17:00Z" },
    ],
  },
  {
    id: "proj-2",
    name: "Bloom Café",
    description: "Warm café website with menu and reservations",
    status: "generated",
    kind: "builder",
    prompt: "Create a cozy café website with warm colors, a menu section, and online reservation form.",
    createdAt: "2026-07-01T08:00:00Z",
    updatedAt: "2026-07-01T08:05:00Z",
    uploadedAssets: ["cafe-interior.jpg"],
    versions: [
      createVersion("v2-1", "v1 — Initial", "Create a cozy café website...", 6),
    ],
    chatHistory: [
      { id: "c5", role: "user", content: "Create a cozy café website with warm colors, a menu section, and online reservation form.", timestamp: "2026-07-01T08:00:00Z" },
      { id: "c6", role: "assistant", content: "Your café website is ready! I've used warm amber tones, an inviting hero with the uploaded interior photo, a categorized menu, and a reservation widget.", timestamp: "2026-07-01T08:05:00Z" },
    ],
  },
  {
    id: "proj-3",
    name: "TechFlow SaaS",
    description: "SaaS product landing with pricing tiers",
    status: "draft",
    kind: "builder",
    prompt: "Design a SaaS landing page with feature highlights, pricing table, and testimonials.",
    createdAt: "2026-07-06T16:00:00Z",
    updatedAt: "2026-07-06T16:00:00Z",
    uploadedAssets: [],
    versions: [],
    chatHistory: [],
  },
];

export const DEPLOYMENT_HISTORY: DeploymentRecord[] = [
  {
    id: "dep-1",
    projectId: "proj-1",
    projectName: "Verdant Studio",
    status: "live",
    url: "https://verdant-studio.dharwin.app",
    startedAt: "2026-07-05T14:25:00Z",
    completedAt: "2026-07-05T14:30:00Z",
    version: "v3 — Current",
  },
  {
    id: "dep-2",
    projectId: "proj-1",
    projectName: "Verdant Studio",
    status: "live",
    url: "https://verdant-studio-v2.dharwin.app",
    startedAt: "2026-07-03T11:00:00Z",
    completedAt: "2026-07-03T11:04:00Z",
    version: "v2 — Refined hero",
  },
  {
    id: "dep-3",
    projectId: "proj-2",
    projectName: "Bloom Café",
    status: "failed",
    startedAt: "2026-07-02T09:00:00Z",
    completedAt: "2026-07-02T09:02:00Z",
    version: "v1 — Initial",
  },
];

export const PROMPT_SUGGESTIONS = [
  "A modern portfolio for a freelance photographer with a fullscreen gallery",
  "Landing page for a fitness app with pricing tiers and testimonials",
  "Restaurant website with menu, reservations, and location map",
  "SaaS dashboard marketing page with feature cards and CTA sections",
  "Personal blog with clean typography and dark mode toggle",
];

export const DEPLOY_STAGES = [
  "Validating project files...",
  "Building production bundle...",
  "Optimizing assets...",
  "Configuring CDN...",
  "Deploying to edge network...",
  "Verifying deployment...",
  "Going live...",
] as const;

export function generateProjectName(prompt: string): string {
  const words = prompt.split(/\s+/).slice(0, 3);
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") || "New Website";
}

export function createProjectFromPrompt(prompt: string, assets: string[]): WebProject {
  const now = new Date().toISOString();
  const version = createVersion(`v-${Date.now()}`, "v1 — Initial", prompt, 0);
  return {
    id: `proj-${Date.now()}`,
    name: generateProjectName(prompt),
    description: prompt.slice(0, 80) + (prompt.length > 80 ? "..." : ""),
    kind: "builder",
    status: "generated",
    prompt,
    createdAt: now,
    updatedAt: now,
    uploadedAssets: assets,
    versions: [version],
    chatHistory: [
      { id: `msg-${Date.now()}-u`, role: "user", content: prompt, timestamp: now },
      {
        id: `msg-${Date.now()}-a`,
        role: "assistant",
        content: `I've built your website based on your requirements${assets.length ? ` and ${assets.length} uploaded asset${assets.length > 1 ? "s" : ""}` : ""}. The design features a responsive layout, smooth animations, and polished UI components. You can preview it, view the source code, or ask me to make changes.`,
        timestamp: now,
      },
    ],
  };
}
