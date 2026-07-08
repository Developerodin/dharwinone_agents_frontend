import type { WebProject } from "./web-agent-data";

export type FileTreeNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileTreeNode[];
};

export type ProjectFiles = Record<string, string>;

export function buildProjectFileTree(project: WebProject, html: string, css: string, js: string): FileTreeNode[] {
  const slug = project.name.toLowerCase().replace(/\s+/g, "-");
  return [
    {
      id: "root",
      name: slug,
      type: "folder",
      path: "",
      children: [
        {
          id: "app",
          name: "app",
          type: "folder",
          path: "app",
          children: [
            { id: "app-layout", name: "layout.tsx", type: "file", path: "app/layout.tsx" },
            { id: "app-page", name: "page.tsx", type: "file", path: "app/page.tsx" },
          ],
        },
        {
          id: "components",
          name: "components",
          type: "folder",
          path: "components",
          children: [
            { id: "comp-hero", name: "Hero.tsx", type: "file", path: "components/Hero.tsx" },
            { id: "comp-nav", name: "Navbar.tsx", type: "file", path: "components/Navbar.tsx" },
            { id: "comp-footer", name: "Footer.tsx", type: "file", path: "components/Footer.tsx" },
            { id: "comp-card", name: "ProjectCard.tsx", type: "file", path: "components/ProjectCard.tsx" },
          ],
        },
        {
          id: "pages",
          name: "pages",
          type: "folder",
          path: "pages",
          children: [
            { id: "pages-index", name: "index.html", type: "file", path: "pages/index.html" },
          ],
        },
        {
          id: "public",
          name: "public",
          type: "folder",
          path: "public",
          children: [
            { id: "pub-favicon", name: "favicon.ico", type: "file", path: "public/favicon.ico" },
            ...(project.uploadedAssets.length
              ? project.uploadedAssets.map((asset, i) => ({
                  id: `pub-asset-${i}`,
                  name: asset,
                  type: "file" as const,
                  path: `public/${asset}`,
                }))
              : [{ id: "pub-hero", name: "hero-bg.jpg", type: "file" as const, path: "public/hero-bg.jpg" }]),
          ],
        },
        {
          id: "assets",
          name: "assets",
          type: "folder",
          path: "assets",
          children: [
            { id: "asset-logo", name: "logo.svg", type: "file", path: "assets/logo.svg" },
            { id: "asset-icons", name: "icons.svg", type: "file", path: "assets/icons.svg" },
          ],
        },
        {
          id: "styles",
          name: "styles",
          type: "folder",
          path: "styles",
          children: [
            { id: "style-globals", name: "globals.css", type: "file", path: "styles/globals.css" },
            { id: "style-vars", name: "variables.css", type: "file", path: "styles/variables.css" },
          ],
        },
        { id: "pkg", name: "package.json", type: "file", path: "package.json" },
        { id: "readme", name: "README.md", type: "file", path: "README.md" },
        { id: "gitignore", name: ".gitignore", type: "file", path: ".gitignore" },
      ],
    },
  ];
}

export function buildProjectFiles(project: WebProject, html: string, css: string, js: string): ProjectFiles {
  const slug = project.name.toLowerCase().replace(/\s+/g, "-");
  return {
    "app/layout.tsx": `import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "${project.name}",
  description: "${project.description.replace(/"/g, '\\"')}",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}`,
    "app/page.tsx": `import { Hero } from "@/components/Hero";
import { ProjectCard } from "@/components/ProjectCard";

export default function HomePage() {
  return (
    <>
      <Hero />
      <section className="section work">
        <h2>Selected work</h2>
        <div className="grid">
          <ProjectCard title="Project One" tag="Brand & Web" />
          <ProjectCard title="Project Two" tag="Product Design" />
          <ProjectCard title="Project Three" tag="E-commerce" />
        </div>
      </section>
    </>
  );
}`,
    "components/Hero.tsx": `export function Hero() {
  return (
    <header className="hero">
      <div className="hero-badge">Award-winning creative studio</div>
      <h1>We craft digital experiences that inspire</h1>
      <p>${project.prompt.slice(0, 120)}${project.prompt.length > 120 ? "..." : ""}</p>
    </header>
  );
}`,
    "components/Navbar.tsx": `export function Navbar() {
  return (
    <nav className="nav">
      <div className="logo">${project.name.split(" ")[0]}<span>Studio</span></div>
      <ul className="nav-links">
        <li><a href="#work">Work</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  );
}`,
    "components/Footer.tsx": `export function Footer() {
  return (
    <footer className="footer">
      <p>&copy; ${new Date().getFullYear()} ${project.name}. Crafted with care.</p>
    </footer>
  );
}`,
    "components/ProjectCard.tsx": `type ProjectCardProps = { title: string; tag: string };

export function ProjectCard({ title, tag }: ProjectCardProps) {
  return (
    <article className="card">
      <div className="card-img" />
      <h3>{title}</h3>
      <p>{tag}</p>
    </article>
  );
}`,
    "pages/index.html": html,
    "styles/globals.css": css,
    "styles/variables.css": `:root {
  --brand-primary: #41a454;
  --brand-navy: #1b3a5c;
  --text-primary: #111827;
  --text-muted: #6b7280;
  --surface: #ffffff;
  --radius-card: 16px;
}`,
    "public/favicon.ico": "<!-- binary favicon placeholder -->",
    "public/hero-bg.jpg": "<!-- image asset: hero background -->",
    "assets/logo.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <rect width="48" height="48" rx="12" fill="#41a454"/>
  <text x="24" y="30" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${project.name.charAt(0)}</text>
</svg>`,
    "assets/icons.svg": "<!-- SVG icon sprite -->",
    "package.json": JSON.stringify(
      {
        name: slug,
        version: "1.0.0",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: { next: "^15.0.0", react: "^19.0.0", "react-dom": "^19.0.0" },
      },
      null,
      2
    ),
    "README.md": `# ${project.name}

${project.description}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Generated by Dharwin Web Agent

Original prompt: ${project.prompt}
`,
    ".gitignore": `node_modules/
.next/
dist/
.env*.local
.DS_Store`,
    "script.js": js,
  };
}

export function getDefaultExpandedFolders(): Set<string> {
  return new Set(["root", "app", "components", "pages", "styles", "public"]);
}

export function getLanguageFromPath(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".svg")) return "xml";
  return "plaintext";
}
