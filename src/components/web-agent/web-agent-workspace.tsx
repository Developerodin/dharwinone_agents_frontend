"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import type {
  ChatAttachment,
  ChatMessage,
  GatheringQuestion,
  GatheringQuestionId,
  WebProject,
  WebsiteQuestionnaire,
  WebsiteQuestionnaireAnswer,
  WebsiteVersion,
} from "@/lib/web-agent-data";
import {
  composeFullPrompt,
  formatGatheringAnswer,
  generateProjectName,
} from "@/lib/web-agent-data";
import { useWebAgent, SAMPLE_CSS, SAMPLE_HTML, SAMPLE_JS } from "./web-agent-context";
import { ResizablePanels } from "./ui/resizable-panels";
import { ChatPanel } from "./chat-panel";
import { WorkspacePanel } from "./workspace-panel";
import { ProjectListView } from "./views/project-list-view";
import { useGenerationEngine } from "./hooks/use-generation-engine";
import { useRequirementGathering } from "./hooks/use-requirement-gathering";

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
  const pendingPromptRef = useRef<{
    prompt: string;
    attachments: ChatAttachment[];
    isNew: boolean;
    questionnaire?: WebsiteQuestionnaire;
  } | null>(null);
  const initialAttachmentsRef = useRef<ChatAttachment[]>([]);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeProjectRef = useRef(activeProject);

  const { state: generation, start, startGathering, stop, resume, reset } = useGenerationEngine();

  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject]);

  useEffect(() => {
    syncFromUrl(searchParams.get("project"), searchParams.get("view"));
  }, [searchParams, syncFromUrl]);

  const appendMessages = useCallback(
    (messages: ChatMessage[]) => {
      const project = activeProjectRef.current;
      if (!project) return;
      updateProject({
        ...project,
        chatHistory: [...project.chatHistory, ...messages],
        updatedAt: new Date().toISOString(),
      });
    },
    [updateProject]
  );

  const handleAskQuestion = useCallback(
    (question: GatheringQuestion) => {
      const project = activeProjectRef.current;
      if (!project) return;
      const now = new Date().toISOString();
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-q`,
        role: "assistant",
        content: question.question,
        timestamp: now,
        questionId: question.id,
        ...(question.options ? { questionOptions: question.options } : {}),
        ...(question.otherPlaceholder ? { otherPlaceholder: question.otherPlaceholder } : {}),
      };
      updateProject({
        ...project,
        chatHistory: [...project.chatHistory, assistantMsg],
        updatedAt: now,
      });
    },
    [updateProject]
  );

  const handleGatheringComplete = useCallback(
    (questionnaire: WebsiteQuestionnaire) => {
      const project = activeProjectRef.current;
      if (!project) return;

      const fullPrompt = composeFullPrompt(questionnaire.initialPrompt, questionnaire);
      const now = new Date().toISOString();
      const attachments = initialAttachmentsRef.current;

      updateProject({
        ...project,
        name: questionnaire.websiteName.trim() || generateProjectName(fullPrompt),
        description: questionnaire.initialPrompt.slice(0, 80),
        prompt: fullPrompt,
        questionnaire,
        updatedAt: now,
      });

      pendingPromptRef.current = { prompt: fullPrompt, attachments, isNew: true, questionnaire };
      reset();
      start();
    },
    [updateProject, reset, start]
  );

  const gathering = useRequirementGathering({
    onAskQuestion: handleAskQuestion,
    onComplete: handleGatheringComplete,
  });

  const finishGeneration = useCallback(() => {
    const pending = pendingPromptRef.current;
    if (!pending || !activeProjectId || !activeProject) return;

    const now = new Date().toISOString();
    const attachmentCount = pending.attachments.length;
    const assistantContent = pending.isNew
      ? `I've built your website based on your requirements${attachmentCount ? ` and ${attachmentCount} uploaded asset${attachmentCount > 1 ? "s" : ""}` : ""}. The design features a responsive layout, smooth animations, and polished UI. Check the preview on the right!`
      : `Done! I've updated the website based on: "${pending.prompt}". A new version is ready in the preview.`;

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: "assistant",
      content: assistantContent,
      timestamp: now,
    };

    if (pending.isNew) {
      const newVersion: WebsiteVersion = {
        id: `v-${Date.now()}`,
        label: "v1 — Initial",
        createdAt: now,
        prompt: pending.prompt,
        html: SAMPLE_HTML,
        css: SAMPLE_CSS,
        js: SAMPLE_JS,
      };
      updateProject({
        ...activeProject,
        status: "generated",
        updatedAt: now,
        versions: [newVersion],
        chatHistory: [...activeProject.chatHistory, assistantMsg],
        uploadedAssets: pending.attachments.map((a) => a.name),
      });
    } else {
      const newVersion: WebsiteVersion = {
        id: `v-${Date.now()}`,
        label: `v${activeProject.versions.length + 1} — Updated`,
        createdAt: now,
        prompt: pending.prompt,
        html: SAMPLE_HTML,
        css: SAMPLE_CSS,
        js: SAMPLE_JS,
      };
      updateProject({
        ...activeProject,
        updatedAt: now,
        versions: [...activeProject.versions, newVersion],
        chatHistory: [...activeProject.chatHistory, assistantMsg],
      });
    }

    setTypingMessageId(assistantMsg.id);
    setSplitView(true);
    pendingPromptRef.current = null;
    reset();
    gathering.reset();
  }, [activeProject, activeProjectId, updateProject, setSplitView, reset, gathering]);

  useEffect(() => {
    if (generation.phase === "complete") {
      completeTimerRef.current = setTimeout(finishGeneration, 500);
    }
    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [generation.phase, finishGeneration]);

  const handleSend = useCallback(
    (prompt: string, attachments: ChatAttachment[]) => {
      const isNew = !activeProject || activeProject.versions.length === 0;
      const now = new Date().toISOString();

      if (
        gathering.isActive &&
        gathering.currentQuestion?.id === "websiteName" &&
        gathering.state.status === "asking"
      ) {
        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}-u`,
          role: "user",
          content: prompt.trim(),
          timestamp: now,
        };
        appendMessages([userMsg]);
        gathering.submitAnswer("websiteName", prompt.trim());
        return;
      }

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-u`,
        role: "user",
        content: prompt,
        timestamp: now,
        ...(attachments.length > 0 ? { attachments } : {}),
      };

      setSplitView(true);

      if (isNew && !activeProject) {
        initialAttachmentsRef.current = attachments;
        const draft: WebProject = {
          id: `proj-${Date.now()}`,
          name: generateProjectName(prompt),
          description: prompt.slice(0, 80),
          status: "generating",
          prompt,
          createdAt: now,
          updatedAt: now,
          uploadedAssets: attachments.map((a) => a.name),
          versions: [],
          chatHistory: [userMsg],
        };
        addProject(draft);
        activeProjectRef.current = draft;
        router.replace(`${ROUTES.webAgent}?project=${draft.id}`, { scroll: false });
        gathering.start(prompt);
        startGathering();
        return;
      }

      if (activeProject) {
        updateProject({
          ...activeProject,
          chatHistory: [...activeProject.chatHistory, userMsg],
          uploadedAssets: [
            ...new Set([...activeProject.uploadedAssets, ...attachments.map((a) => a.name)]),
          ],
        });
      }

      pendingPromptRef.current = { prompt, attachments, isNew };
      start();
    },
    [
      activeProject,
      addProject,
      appendMessages,
      gathering,
      router,
      setSplitView,
      start,
      startGathering,
      updateProject,
    ]
  );

  const handleGatheringAnswer = useCallback(
    (questionId: GatheringQuestionId, answer: WebsiteQuestionnaireAnswer) => {
      const project = activeProjectRef.current;
      if (!project) return;
      const now = new Date().toISOString();
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-u`,
        role: "user",
        content: formatGatheringAnswer(questionId, answer),
        timestamp: now,
      };
      updateProject({
        ...project,
        chatHistory: [...project.chatHistory, userMsg],
        updatedAt: now,
      });
      gathering.submitAnswer(questionId, answer);
    },
    [gathering, updateProject]
  );

  const handleRegenerate = useCallback(() => {
    if (!activeProject) return;
    setSplitView(true);
    pendingPromptRef.current = {
      prompt: activeProject.prompt,
      attachments: [],
      isNew: false,
    };
    start();
  }, [activeProject, setSplitView, start]);

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
    (splitView ||
      gathering.isActive ||
      isFinalGenerating ||
      generation.phase === "stopped" ||
      Boolean(activeProjectId));

  const chatPanel = (
    <ChatPanel
      project={activeProject}
      generation={generation}
      isTyping={false}
      typingMessageId={typingMessageId}
      onTypingComplete={() => setTypingMessageId(null)}
      onSend={handleSend}
      onStop={stop}
      onResume={resume}
      onRegenerate={handleRegenerate}
      gatheringStatus={gathering.state.status}
      gatheringQuestion={gathering.currentQuestion}
      gatheringActive={gathering.isActive}
      onGatheringAnswer={handleGatheringAnswer}
      showFinalGenerationStatus={isFinalGenerating && !gathering.isActive}
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
