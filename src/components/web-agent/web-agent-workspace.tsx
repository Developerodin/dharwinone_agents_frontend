"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import type {
  ChatAttachment,
  ChatMessage,
  WebProject,
  WebsiteVersion,
} from "@/lib/web-agent-data";
import { generateProjectName } from "@/lib/web-agent-data";
import { useWebAgent, SAMPLE_CSS, SAMPLE_JS } from "./web-agent-context";
import { ResizablePanels } from "./ui/resizable-panels";
import { ChatPanel } from "./chat-panel";
import { WorkspacePanel } from "./workspace-panel";
import { ProjectListView } from "./views/project-list-view";
import { useGenerationEngine } from "./hooks/use-generation-engine";
import {
  createBuilderProject,
  editBuilderProject,
  getBuilderProjectContext,
  getBuilderWorkingHtml,
  isUnauthorizedError,
  listBuilderTemplates,
  requestTemplateGeneration,
  selectBuilderTemplate,
  sendBuilderChat,
} from "@/lib/builder-api";
import { getToken } from "@/lib/auth";
import type {
  BuilderChatTurn,
  BuilderEditRecord,
  BuilderProjectContext,
  BuilderTemplate,
} from "@/lib/builder-types";

function isGenerateIntent(prompt: string): boolean {
  return /\b(generate(?:\s+templates?)?|go\s+ahead|please\s+do|do\s+it|proceed|start(?:\s+generation)?|build\s+it|create\s+it)\b/i.test(
    prompt.trim()
  );
}

const GENERATION_POLL_ATTEMPTS = 48;
const GENERATION_POLL_MS = 1500;
const GENERATION_RECOVERY_ATTEMPTS = 120;
const GENERATION_RECOVERY_MS = 2000;
const EDIT_STREAM_POLL_MS = 1200;
const EDIT_RECOVERY_ATTEMPTS = 90;
const EDIT_RECOVERY_MS = 2000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractApiDetail(message: string) {
  const sep = " - ";
  const i = message.indexOf(sep);
  if (i < 0) return "";
  return message.slice(i + sep.length).trim();
}

function isGenerationPendingError(message: string) {
  const low = message.toLowerCase();
  return (
    low.includes("api timeout") ||
    low.includes("generation produced no working html") ||
    low.includes("working html not found")
  );
}

function isEditPendingError(message: string) {
  const low = message.toLowerCase();
  return low.includes("api timeout");
}

function tsIso(tsSeconds?: number) {
  if (!tsSeconds) return new Date().toISOString();
  return new Date(tsSeconds * 1000).toISOString();
}

function extractInlineStyles(html: string) {
  const matches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  return matches.map((m) => m[1].trim()).join("\n\n");
}

function extractInlineScripts(html: string) {
  const matches = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  return matches.map((m) => m[1].trim()).join("\n\n");
}

function asVersion(html: string, prompt: string, idx: number): WebsiteVersion {
  return {
    id: `v-${Date.now()}-${idx}`,
    label: `v${idx} — ${idx === 1 ? "Initial" : "Updated"}`,
    createdAt: new Date().toISOString(),
    prompt,
    html,
    css: extractInlineStyles(html) || SAMPLE_CSS,
    js: extractInlineScripts(html) || SAMPLE_JS,
  };
}

function mapTurns(turns: BuilderChatTurn[]): ChatMessage[] {
  return turns.map((turn, idx) => ({
    id: `turn-${idx}-${turn.ts}`,
    role: turn.role,
    content: turn.text,
    timestamp: tsIso(turn.ts),
  }));
}

function mapEditTurns(edits: BuilderEditRecord[]): ChatMessage[] {
  const sorted = [...edits].sort((a, b) => a.ts - b.ts);
  const turns: ChatMessage[] = [];
  for (const edit of sorted) {
    const prompt = (edit.userPrompt || "").trim();
    if (prompt) {
      turns.push({
        id: `edit-u-${edit.editId}-${edit.ts}`,
        role: "user",
        content: prompt,
        timestamp: tsIso(edit.ts),
      });
    }
    const summary = (edit.actionSummary || "Applied your change.").trim();
    turns.push({
      id: `edit-a-${edit.editId}-${edit.ts}`,
      role: "assistant",
      content: summary,
      timestamp: tsIso(edit.ts + 0.001),
    });
  }
  return turns;
}

function mergeHydratedHistory(
  turns: BuilderChatTurn[] | undefined,
  edits: BuilderEditRecord[] | undefined
): ChatMessage[] {
  const merged = [...mapTurns(turns ?? []), ...mapEditTurns(edits ?? [])];
  merged.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  return merged;
}

function hydrateProjectFromContext(
  current: WebProject | null,
  ctx: BuilderProjectContext
): WebProject {
  const html = ctx.workingHtml;
  const versions =
    html && (!current || !current.versions.length)
      ? [asVersion(html, ctx.project.initialPrompt ?? "Generated website", 1)]
      : current?.versions ?? [];
  const prompt = current?.prompt || ctx.project.initialPrompt || "Build website";
  const hydratedHistory = mergeHydratedHistory(ctx.chat?.turns, ctx.edits);
  return {
    id: ctx.project.projectId,
    name: ctx.project.projectName,
    description: (ctx.project.initialPrompt || "Website project").slice(0, 120),
    status: versions.length ? "generated" : "draft",
    prompt,
    createdAt: tsIso(ctx.project.createdAt),
    updatedAt: tsIso(ctx.project.updatedAt),
    versions,
    chatHistory: hydratedHistory.length ? hydratedHistory : current?.chatHistory ?? [],
    uploadedAssets: (ctx.assets ?? []).map((a) => a.filename),
    deployedUrl: current?.deployedUrl,
  };
}

function WebAgentWorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    activeProject,
    activeProjectId,
    pageView,
    splitView,
    setSplitView,
    syncFromUrl,
    addProject,
    updateProject,
    addDeployment,
    deployments,
  } = useWebAgent();

  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [pendingThread, setPendingThread] = useState<ChatMessage[]>([]);
  const activeProjectRef = useRef(activeProject);
  const hydratingRef = useRef<string | null>(null);
  const generationRecoveryRef = useRef(new Set<string>());
  const editRecoveryRef = useRef(new Set<string>());
  const { state: generation, start, stop, resume, reset } = useGenerationEngine();

  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject]);

  useEffect(() => {
    syncFromUrl(searchParams.get("project"), searchParams.get("view"));
  }, [searchParams, syncFromUrl]);

  useEffect(() => {
    if (!activeProjectId) return;
    if (hydratingRef.current === activeProjectId) return;
    let cancelled = false;
    hydratingRef.current = activeProjectId;
    const hydrate = async () => {
      if (!getToken()) return;
      try {
        const ctx = await getBuilderProjectContext(activeProjectId);
        if (cancelled) return;
        const hydrated = hydrateProjectFromContext(activeProjectRef.current, ctx);
        updateProject(hydrated);
      } catch (e) {
        if (cancelled || isUnauthorizedError(e)) return;
        console.warn("project context hydrate failed", e);
      } finally {
        hydratingRef.current = null;
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, updateProject]);

  const applyTemplateGeneration = useCallback(
    async (project: WebProject, prompt: string, force = false) => {
      const pollGeneratedHtml = async (attempts: number, waitMs: number) => {
        let html: string | null = null;
        let lastPollError: unknown = null;
        for (let attempt = 0; attempt < attempts && !html; attempt++) {
          let templates: BuilderTemplate[] = [];
          try {
            templates = await listBuilderTemplates(project.id);
          } catch (e) {
            lastPollError = e;
          }
          if (templates.length) {
            const selected = await selectBuilderTemplate(project.id, templates[0].templateId).catch(
              (e) => {
                lastPollError = e;
                return null;
              }
            );
            html = selected?.html ?? null;
          }
          if (!html) {
            const working = await getBuilderWorkingHtml(project.id).catch((e) => {
              lastPollError = e;
              return null;
            });
            html = working?.html ?? null;
          }
          if (!html && attempt < attempts - 1) {
            await delay(waitMs);
          }
        }
        return { html, lastPollError };
      };

      const commitGeneratedHtml = (html: string, assistantText: string) => {
        const current = activeProjectRef.current?.id === project.id ? activeProjectRef.current : project;
        const latest = current.versions[current.versions.length - 1];
        const sameAsLatest = Boolean(latest?.html && latest.html.trim() === html.trim());
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-a`,
          role: "assistant",
          content: assistantText,
          timestamp: new Date().toISOString(),
        };
        const updated = {
          ...current,
          status: "generated" as const,
          versions: sameAsLatest
            ? current.versions
            : [...current.versions, asVersion(html, prompt, current.versions.length + 1)],
          chatHistory: [...current.chatHistory, assistantMsg],
          updatedAt: new Date().toISOString(),
        };
        updateProject(updated);
        activeProjectRef.current = updated;
        setTypingMessageId(assistantMsg.id);
      };

      const startedMsg: ChatMessage = {
        id: `msg-${Date.now()}-gen-start`,
        role: "assistant",
        content: "Great, starting website generation now...",
        timestamp: new Date().toISOString(),
      };
      const projectWhileGenerating = {
        ...project,
        status: "generating" as const,
        chatHistory: [...project.chatHistory, startedMsg],
        updatedAt: new Date().toISOString(),
      };
      updateProject(projectWhileGenerating);
      activeProjectRef.current = projectWhileGenerating;
      setTypingMessageId(startedMsg.id);

      try {
        await requestTemplateGeneration(project.id, force);
        const firstPass = await pollGeneratedHtml(
          GENERATION_POLL_ATTEMPTS,
          GENERATION_POLL_MS
        );
        if (!firstPass.html) {
          throw (
            (firstPass.lastPollError as Error) ||
            new Error("generation produced no working html")
          );
        }
        commitGeneratedHtml(
          firstPass.html,
          "Generated your website template and loaded it in workspace preview."
        );
        return true;
      } catch (e) {
        const current = activeProjectRef.current?.id === project.id ? activeProjectRef.current : project;
        const message = String(e);
        const detail = extractApiDetail(message);
        const retryable = isGenerationPendingError(message);
        if (retryable && !generationRecoveryRef.current.has(project.id)) {
          generationRecoveryRef.current.add(project.id);
          void (async () => {
            try {
              const recovered = await pollGeneratedHtml(
                GENERATION_RECOVERY_ATTEMPTS,
                GENERATION_RECOVERY_MS
              );
              if (!recovered.html) return;
              commitGeneratedHtml(
                recovered.html,
                "Generation finished. I loaded your website in the preview."
              );
            } finally {
              generationRecoveryRef.current.delete(project.id);
              reset();
            }
          })();
        }
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-gen-failed`,
          role: "assistant",
          content: retryable
            ? message.toLowerCase().includes("api timeout")
              ? "Template generation is taking longer than usual. I'm still checking in the background and will load your site as soon as it's ready."
              : "Generation is still running. I'll keep checking and load it automatically once it's ready."
            : detail || "I couldn't finish generation due to a backend error. Please try again.",
          timestamp: new Date().toISOString(),
        };
        const failed = {
          ...current,
          status: retryable
            ? ("generating" as const)
            : current.versions.length
            ? ("generated" as const)
            : ("draft" as const),
          chatHistory: [...current.chatHistory, assistantMsg],
          updatedAt: new Date().toISOString(),
        };
        updateProject(failed);
        activeProjectRef.current = failed;
        setTypingMessageId(assistantMsg.id);
        if (!retryable) {
          console.warn("template generation failed", e);
        }
        return false;
      }
    },
    [updateProject, reset]
  );

  const handleSend = useCallback(
    (prompt: string, attachments: ChatAttachment[]) => {
      void (async () => {
        const cleanPrompt = prompt.trim();
        if (!cleanPrompt) return;
        setSplitView(true);
        start();
        const now = new Date().toISOString();
        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}-u`,
          role: "user",
          content: cleanPrompt,
          timestamp: now,
          ...(attachments.length ? { attachments } : {}),
        };
        let keepProgressIndicator = false;

        try {
          let project = activeProjectRef.current;
          if (!project) {
            setPendingThread((prev) => [...prev, userMsg]);
          }

          if (!project) {
            const created = await createBuilderProject({
              projectName: generateProjectName(cleanPrompt),
              initialPrompt: cleanPrompt,
            });
            project = {
              id: created.projectId,
              name: created.projectName,
              description: cleanPrompt.slice(0, 120),
              status: "draft",
              prompt: cleanPrompt,
              createdAt: tsIso(created.createdAt),
              updatedAt: tsIso(created.updatedAt),
              versions: [],
              chatHistory: [userMsg],
              uploadedAssets: attachments.map((a) => a.name),
            };
            addProject(project);
            activeProjectRef.current = project;
            setPendingThread([]);
            router.replace(`${ROUTES.webAgent}?project=${project.id}`, { scroll: false });
          } else {
            const updated = {
              ...project,
              chatHistory: [...project.chatHistory, userMsg],
              uploadedAssets: [
                ...new Set([...project.uploadedAssets, ...attachments.map((a) => a.name)]),
              ],
              updatedAt: now,
            };
            updateProject(updated);
            project = updated;
            activeProjectRef.current = updated;

            // Hydration is async, so local state can still show zero versions for a
            // project the backend already built. Ask the server before routing, or an
            // edit gets sent down the generate path and rebuilds the site.
            if (!project.versions.length) {
              const working = await getBuilderWorkingHtml(project.id).catch(() => null);
              const html = working?.html?.trim();
              if (html) {
                project = {
                  ...project,
                  status: "generated",
                  versions: [asVersion(html, project.prompt || cleanPrompt, 1)],
                  updatedAt: new Date().toISOString(),
                };
                updateProject(project);
                activeProjectRef.current = project;
              }
            }
          }

          if (project.versions.length > 0 && !isGenerateIntent(cleanPrompt)) {
            const applyingMsg: ChatMessage = {
              id: `msg-${Date.now()}-applying`,
              role: "assistant",
              content: "Applying your update...",
              timestamp: new Date().toISOString(),
            };
            const projectApplying = {
              ...project,
              chatHistory: [...project.chatHistory, applyingMsg],
              updatedAt: new Date().toISOString(),
            };
            updateProject(projectApplying);
            project = projectApplying;
            activeProjectRef.current = projectApplying;
            setTypingMessageId(applyingMsg.id);

            const liveVersionId = `live-edit-${Date.now()}`;
            const baseHtml = project.versions[project.versions.length - 1]?.html?.trim() ?? "";
            let lastStreamedHtml = baseHtml;
            let stopStreaming = false;
            let streamMessageShown = false;

            const upsertLivePreview = (html: string) => {
              const trimmed = (html || "").trim();
              if (!trimmed || trimmed === lastStreamedHtml) return false;
              lastStreamedHtml = trimmed;
              const current =
                activeProjectRef.current?.id === project.id ? activeProjectRef.current : project;
              const draft = asVersion(trimmed, cleanPrompt, Math.max(1, current.versions.length));
              const liveVersion = {
                ...draft,
                id: liveVersionId,
                label: "Live update stream...",
              };
              const versions = current.versions.some((v) => v.id === liveVersionId)
                ? current.versions.map((v) => (v.id === liveVersionId ? liveVersion : v))
                : [...current.versions, liveVersion];
              const chatHistory =
                streamMessageShown
                  ? current.chatHistory
                  : [
                      ...current.chatHistory,
                      {
                        id: `msg-${Date.now()}-stream`,
                        role: "assistant" as const,
                        content: "Streaming live changes as they are applied...",
                        timestamp: new Date().toISOString(),
                      },
                    ];
              streamMessageShown = true;
              const updated = {
                ...current,
                status: "generating" as const,
                versions,
                chatHistory,
                updatedAt: new Date().toISOString(),
              };
              updateProject(updated);
              activeProjectRef.current = updated;
              return true;
            };

            const streamPromise = (async () => {
              while (!stopStreaming) {
                const working = await getBuilderWorkingHtml(project.id).catch(() => null);
                if (working?.html) upsertLivePreview(working.html);
                if (stopStreaming) break;
                await delay(EDIT_STREAM_POLL_MS);
              }
            })();

            try {
              const edited = await editBuilderProject(project.id, cleanPrompt);
              stopStreaming = true;
              await streamPromise;
              const current =
                activeProjectRef.current?.id === project.id ? activeProjectRef.current : project;
              const committed = current.versions.filter((v) => v.id !== liveVersionId);
              const version = asVersion(
                edited.html,
                cleanPrompt,
                Math.max(1, committed.length + 1)
              );
              const assistantMsg: ChatMessage = {
                id: `msg-${Date.now()}-a`,
                role: "assistant",
                content: "Applied your update to the current website version.",
                timestamp: new Date().toISOString(),
              };
              const updated = {
                ...current,
                status: "generated" as const,
                versions: [...committed, version],
                chatHistory: [...current.chatHistory, assistantMsg],
                updatedAt: new Date().toISOString(),
              };
              updateProject(updated);
              activeProjectRef.current = updated;
              setTypingMessageId(assistantMsg.id);
            } catch (editErr) {
              stopStreaming = true;
              await streamPromise;
              const message = String(editErr);
              const detail = extractApiDetail(message);
              const retryable = isEditPendingError(message);
              keepProgressIndicator = retryable;
              const current =
                activeProjectRef.current?.id === project.id ? activeProjectRef.current : project;
              const pendingMsg: ChatMessage = {
                id: `msg-${Date.now()}-edit-pending`,
                role: "assistant",
                content: retryable
                  ? "Edit is still processing. I'll keep streaming and auto-load the final change."
                  : detail || "Edit failed before completion. Please try again.",
                timestamp: new Date().toISOString(),
              };
              const pendingState = {
                ...current,
                status: retryable ? ("generating" as const) : ("generated" as const),
                chatHistory: [...current.chatHistory, pendingMsg],
                updatedAt: new Date().toISOString(),
              };
              updateProject(pendingState);
              activeProjectRef.current = pendingState;
              setTypingMessageId(pendingMsg.id);
              if (retryable && !editRecoveryRef.current.has(project.id)) {
                editRecoveryRef.current.add(project.id);
                void (async () => {
                  try {
                    for (let attempt = 0; attempt < EDIT_RECOVERY_ATTEMPTS; attempt++) {
                      const working = await getBuilderWorkingHtml(project.id).catch(() => null);
                      if (working?.html && upsertLivePreview(working.html)) {
                        const recoveredCurrent =
                          activeProjectRef.current?.id === project.id
                            ? activeProjectRef.current
                            : project;
                        const committed = recoveredCurrent.versions.filter(
                          (v) => v.id !== liveVersionId
                        );
                        const version = asVersion(
                          working.html,
                          cleanPrompt,
                          Math.max(1, committed.length + 1)
                        );
                        const assistantMsg: ChatMessage = {
                          id: `msg-${Date.now()}-a`,
                          role: "assistant",
                          content: "Applied your update to the current website version.",
                          timestamp: new Date().toISOString(),
                        };
                        const done = {
                          ...recoveredCurrent,
                          status: "generated" as const,
                          versions: [...committed, version],
                          chatHistory: [...recoveredCurrent.chatHistory, assistantMsg],
                          updatedAt: new Date().toISOString(),
                        };
                        updateProject(done);
                        activeProjectRef.current = done;
                        setTypingMessageId(assistantMsg.id);
                        return;
                      }
                      await delay(EDIT_RECOVERY_MS);
                    }
                  } finally {
                    editRecoveryRef.current.delete(project.id);
                    reset();
                  }
                })();
              }
            }
            return;
          }

          const response = await sendBuilderChat(project.id, cleanPrompt);
          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now()}-a`,
            role: "assistant",
            content: response.assistantMessage,
            timestamp: new Date().toISOString(),
          };
          const updatedAfterChat = {
            ...project,
            chatHistory: [...project.chatHistory, assistantMsg],
            updatedAt: new Date().toISOString(),
          };
          updateProject(updatedAfterChat);
          setTypingMessageId(assistantMsg.id);

          const shouldGenerate = response.startGeneration || isGenerateIntent(cleanPrompt);
          if (shouldGenerate) {
            const generated = await applyTemplateGeneration(
              updatedAfterChat,
              cleanPrompt,
              updatedAfterChat.versions.length > 0
            );
            if (!generated && activeProjectRef.current?.status === "generating") {
              keepProgressIndicator = true;
            }
          }
        } catch (e) {
          const project = activeProjectRef.current;
          const message = String(e);
          const detail = extractApiDetail(message);
          const assistantMsg: ChatMessage = {
            id: `msg-${Date.now()}-err`,
            role: "assistant",
            content: message.includes("timeout")
              ? "This request is taking too long. Please retry."
              : detail || "I could not reach the backend right now. Please try again in a moment.",
            timestamp: new Date().toISOString(),
          };
          if (project) {
            updateProject({
              ...project,
              chatHistory: [...project.chatHistory, assistantMsg],
              updatedAt: new Date().toISOString(),
            });
          } else {
            setPendingThread((prev) => [...prev, assistantMsg]);
          }
          console.warn("web-agent send failed", e);
        } finally {
          const current = activeProjectRef.current;
          const currentId = current?.id;
          const hasBackgroundWork = Boolean(
            (current && current.status === "generating") ||
              (currentId && generationRecoveryRef.current.has(currentId)) ||
              (currentId && editRecoveryRef.current.has(currentId))
          );
          if (!keepProgressIndicator && !hasBackgroundWork) {
            reset();
          }
        }
      })();
    },
    [addProject, router, setSplitView, start, updateProject, reset, applyTemplateGeneration]
  );

  const handleRegenerate = useCallback(() => {
    if (!activeProject) return;
    void (async () => {
      let keepProgressIndicator = false;
      start();
      try {
        const generated = await applyTemplateGeneration(
          activeProject,
          activeProject.prompt || "generate",
          true
        );
        if (!generated && activeProjectRef.current?.status === "generating") {
          keepProgressIndicator = true;
        }
      } catch (e) {
        console.warn("regenerate failed", e);
      } finally {
        const current = activeProjectRef.current;
        const currentId = current?.id;
        const hasBackgroundWork = Boolean(
          (current && current.status === "generating") ||
            (currentId && generationRecoveryRef.current.has(currentId)) ||
            (currentId && editRecoveryRef.current.has(currentId))
        );
        if (!keepProgressIndicator && !hasBackgroundWork) {
          reset();
        }
      }
    })();
  }, [activeProject, start, applyTemplateGeneration, reset]);

  if (pageView === "my-projects") {
    return <ProjectListView variant="my" />;
  }

  if (pageView === "deploy-projects") {
    return <ProjectListView variant="deployed" />;
  }

  const isFinalGenerating =
    generation.phase === "thinking" ||
    generation.phase === "building" ||
    generation.phase === "generating";

  const showSplit =
    pageView === "workspace" &&
    (splitView || isFinalGenerating || generation.phase === "stopped" || Boolean(activeProjectId));

  const chatPanel = (
    <ChatPanel
      project={
        activeProject ??
        (pendingThread.length
          ? {
              id: "__pending__",
              name: "New project",
              description: "Awaiting backend response",
              status: "draft",
              prompt: pendingThread[0]?.content ?? "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              versions: [],
              chatHistory: pendingThread,
              uploadedAssets: [],
            }
          : null)
      }
      generation={generation}
      isTyping={false}
      typingMessageId={typingMessageId}
      onTypingComplete={() => setTypingMessageId(null)}
      onSend={handleSend}
      onStop={stop}
      onResume={resume}
      onRegenerate={handleRegenerate}
      gatheringStatus="idle"
      gatheringQuestion={null}
      gatheringActive={false}
      onGatheringAnswer={() => {}}
      showFinalGenerationStatus={isFinalGenerating}
      fullscreen={!showSplit}
    />
  );

  if (!showSplit) {
    return <div className="wa-fullscreen-chat h-full wa-animate-fade-in">{chatPanel}</div>;
  }

  return (
    <div className="h-full wa-animate-fade-in">
      <ResizablePanels
        left={chatPanel}
        right={
          <WorkspacePanel
            project={activeProject}
            generation={generation}
            deployments={deployments}
            onUpdateProject={updateProject}
            onDeploy={addDeployment}
            onRegenerate={handleRegenerate}
          />
        }
      />
    </div>
  );
}

export function WebAgentWorkspace() {
  return (
    <Suspense fallback={<div className="h-full wa-shimmer rounded-2xl" />}>
      <WebAgentWorkspaceInner />
    </Suspense>
  );
}
