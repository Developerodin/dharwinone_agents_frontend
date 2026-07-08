"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PROMPT_SUGGESTIONS } from "@/lib/web-agent-data";
import type {
  ChatAttachment,
  ChatMessage,
  GatheringQuestion,
  GatheringQuestionId,
  WebProject,
  WebsiteQuestionnaireAnswer,
} from "@/lib/web-agent-data";
import { CHAT_ATTACHMENT_ACCEPT, filesToChatAttachments, mergeAttachments } from "@/lib/chat-attachments";
import type { GenerationState } from "./hooks/use-generation-engine";
import type { GatheringStatus } from "./hooks/use-requirement-gathering";
import { TypingMessage } from "./ui/typing-message";
import { ChatMessageAttachments, ComposerAttachmentPreview } from "./ui/chat-attachments";
import { ConversationQuestion } from "./ui/conversation-question";
import { ConversationStatus } from "./ui/conversation-status";
import {
  BotIcon,
  PlayIcon,
  RefreshIcon,
  SparklesIcon,
  StopIcon,
  UploadIcon,
} from "@/components/icons";

type ChatPanelProps = {
  project: WebProject | null;
  generation: GenerationState;
  isTyping: boolean;
  typingMessageId: string | null;
  onTypingComplete: () => void;
  onSend: (prompt: string, attachments: ChatAttachment[]) => void;
  onStop: () => void;
  onResume: () => void;
  onRegenerate: () => void;
  gatheringStatus: GatheringStatus;
  gatheringQuestion: GatheringQuestion | null;
  gatheringActive: boolean;
  onGatheringAnswer: (questionId: GatheringQuestionId, answer: WebsiteQuestionnaireAnswer) => void;
  showFinalGenerationStatus: boolean;
  fullscreen?: boolean;
};

export function ChatPanel({
  project,
  generation,
  isTyping,
  typingMessageId,
  onTypingComplete,
  onSend,
  onStop,
  onResume,
  onRegenerate,
  gatheringStatus,
  gatheringQuestion,
  gatheringActive,
  onGatheringAnswer,
  showFinalGenerationStatus,
  fullscreen = false,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isFinalGenerating =
    generation.phase === "thinking" ||
    generation.phase === "building" ||
    generation.phase === "generating";
  const isStopped = generation.phase === "stopped";
  const messages = project?.chatHistory ?? [];
  const isEmpty = messages.length === 0;

  const isGatheringProcessing =
    gatheringActive &&
    (gatheringStatus === "thinking" ||
      gatheringStatus === "understanding" ||
      gatheringStatus === "building");

  const isAskingName =
    gatheringActive &&
    gatheringStatus === "asking" &&
    gatheringQuestion?.id === "websiteName";

  const isAskingChoice =
    gatheringActive &&
    gatheringStatus === "asking" &&
    gatheringQuestion?.inputType === "choice";

  const composerDisabled =
    isGatheringProcessing ||
    isAskingChoice ||
    (isFinalGenerating && showFinalGenerationStatus) ||
    isTyping;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, generation.phase, gatheringStatus, gatheringQuestion?.id]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const incoming = await filesToChatAttachments(files);
    if (incoming.length) {
      setAttachments((prev) => mergeAttachments(prev, incoming));
    }
  }, []);

  const handleSend = () => {
    if (!input.trim() || composerDisabled) return;
    onSend(input.trim(), attachments);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, fullscreen ? 200 : 160)}px`;
  };

  const composerPlaceholder = isAskingName
    ? "Enter your website name..."
    : fullscreen
      ? "Describe the website you want to build..."
      : "Ask for changes...";

  const submitLabel =
    isAskingName || (isEmpty && !gatheringActive)
      ? "Generate Website"
      : project?.versions.length
        ? "Send"
        : "Continue";

  const composer = (
    <Composer
      input={input}
      attachments={attachments}
      isDragging={isDragging}
      isGenerating={isFinalGenerating && showFinalGenerationStatus}
      isStopped={isStopped}
      isTyping={isTyping}
      disabled={composerDisabled}
      project={project}
      textareaRef={textareaRef}
      fileInputRef={fileInputRef}
      fullscreen={fullscreen}
      placeholder={composerPlaceholder}
      submitLabel={submitLabel}
      onInputChange={handleTextareaInput}
      onSend={handleSend}
      onStop={onStop}
      onResume={onResume}
      onRegenerate={onRegenerate}
      onRemoveAttachment={(id) => setAttachments((items) => items.filter((item) => item.id !== id))}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
      onFileSelect={(files) => addFiles(files)}
      hideAttachments={gatheringActive}
    />
  );

  const conversationContent = (
    <>
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          isTyping={msg.role === "assistant" && msg.id === typingMessageId}
          onTypingComplete={onTypingComplete}
          centered={fullscreen}
          showInlineQuestion={
            gatheringActive &&
            gatheringStatus === "asking" &&
            msg.questionId === gatheringQuestion?.id &&
            msg.questionOptions !== undefined
          }
          onQuestionAnswer={onGatheringAnswer}
        />
      ))}

      {isGatheringProcessing && (
        <ConversationStatus status={gatheringStatus} centered={fullscreen} />
      )}

      {showFinalGenerationStatus && isFinalGenerating && (
        <GenerationBubble generation={generation} centered={fullscreen} />
      )}
    </>
  );

  if (fullscreen) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto custom-scrollbar px-4 py-10 sm:px-8">
          <div className="w-full max-w-3xl wa-animate-fade-up">
            {isEmpty && !gatheringActive ? (
              <div className="mb-10 text-center">
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white shadow-xl ring-1 ring-defaultborder/30">
                  <SparklesIcon className="h-11 w-11 text-brand-green" />
                </div>
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-brand-green">Web Agent</p>
                <h1 className="m-0 mt-3 font-poppins text-[2rem] font-bold leading-tight tracking-tight text-defaulttextcolor sm:text-[2.75rem]">
                  Build your website<br className="hidden sm:block" /> with AI
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-textmuted">
                  Describe what you want to create. Upload reference images and get a complete, production-ready website in minutes.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-2.5">
                  {PROMPT_SUGGESTIONS.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setInput(s)}
                      className="wa-suggestion-chip"
                      style={{ animation: `wa-fade-up 0.4s ease-out ${i * 0.06}s both` }}
                    >
                      {s.length > 52 ? s.slice(0, 52) + "…" : s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6 space-y-4">{conversationContent}</div>
            )}
            <div ref={chatEndRef} />
            {composer}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {!isEmpty && (
        <div className="wa-chat-header-compact shrink-0 border-b border-defaultborder/50 px-4 py-2.5">
          <p className="m-0 truncate text-sm font-semibold text-defaulttextcolor">
            {project?.name ?? "Chat"}
          </p>
          <p className="m-0 truncate text-[0.6875rem] text-textmuted">
            {project?.versions.length
              ? `${project.versions.length} version${project.versions.length !== 1 ? "s" : ""}`
              : gatheringActive
                ? "Gathering requirements..."
                : "Generating..."}
          </p>
        </div>
      )}

      <div className="relative z-0 flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        {isEmpty && !gatheringActive && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <BotIcon className="h-10 w-10 text-brand-green/40" />
            <p className="mt-3 text-sm text-textmuted">Send a message to continue building</p>
          </div>
        )}

        {conversationContent}

        {isTyping && !isFinalGenerating && !isGatheringProcessing && (
          <div className="mt-4 flex justify-start">
            <div className="wa-chat-bubble-ai flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3">
              <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
              <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
              <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {project && messages.length <= 2 && !isFinalGenerating && !gatheringActive && (
        <div className="shrink-0 border-t border-defaultborder/40 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {["Make the hero darker", "Add testimonials", "Use blue accents"].map((s) => (
              <button key={s} type="button" onClick={() => setInput(s)} className="wa-suggestion-chip shrink-0">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 border-t border-defaultborder/50 p-4">{composer}</div>
    </div>
  );
}

function Composer({
  input,
  attachments,
  isDragging,
  isGenerating,
  isStopped,
  isTyping,
  disabled,
  project,
  textareaRef,
  fileInputRef,
  fullscreen,
  placeholder,
  submitLabel,
  onInputChange,
  onSend,
  onStop,
  onResume,
  onRegenerate,
  onRemoveAttachment,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  hideAttachments,
}: {
  input: string;
  attachments: ChatAttachment[];
  isDragging: boolean;
  isGenerating: boolean;
  isStopped: boolean;
  isTyping: boolean;
  disabled: boolean;
  project: WebProject | null;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  fullscreen?: boolean;
  placeholder: string;
  submitLabel: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onStop: () => void;
  onResume: () => void;
  onRegenerate: () => void;
  onRemoveAttachment: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (files: FileList) => void;
  hideAttachments?: boolean;
}) {
  return (
    <div
      className={`wa-prompt-glow rounded-2xl border bg-white transition-all duration-300 ${
        isDragging ? "border-brand-green wa-upload-zone-active" : "border-defaultborder/60"
      } ${fullscreen ? "shadow-lg" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {!hideAttachments && attachments.length > 0 && (
        <ComposerAttachmentPreview attachments={attachments} onRemove={onRemoveAttachment} />
      )}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={onInputChange}
        placeholder={placeholder}
        rows={fullscreen ? 3 : 2}
        className="w-full resize-none border-0 bg-transparent px-4 pt-4 pb-2 text-sm text-defaulttextcolor outline-none placeholder:text-textmuted/60"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <div className="flex items-center justify-between border-t border-defaultborder/40 px-3 py-3">
        <div className="flex items-center gap-1">
          {!hideAttachments && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-textmuted transition-all hover:bg-light hover:text-brand-green"
                title="Upload images or PDFs"
              >
                <UploadIcon className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={CHAT_ATTACHMENT_ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) onFileSelect(e.target.files);
                  e.target.value = "";
                }}
              />
            </>
          )}
          {project && project.versions.length > 0 && !isGenerating && (
            <button type="button" onClick={onRegenerate} className="flex h-9 w-9 items-center justify-center rounded-xl text-textmuted hover:bg-light" title="Regenerate">
              <RefreshIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <button type="button" onClick={onStop} className="ti-btn ti-btn-light ti-btn-sm gap-1.5 text-danger">
              <StopIcon className="h-3 w-3" /> Stop
            </button>
          )}
          {isStopped && (
            <button type="button" onClick={onResume} className="ti-btn ti-btn-light ti-btn-sm gap-1.5">
              <PlayIcon className="h-3 w-3" /> Continue
            </button>
          )}
          <button
            type="button"
            onClick={onSend}
            disabled={!input.trim() || disabled}
            className={`wa-btn-glow ti-btn ti-btn-primary-full gap-2 disabled:opacity-50 ${fullscreen ? "px-6" : "ti-btn-sm"}`}
          >
            <SparklesIcon className="h-4 w-4" />
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function GenerationBubble({ generation, centered }: { generation: GenerationState; centered?: boolean }) {
  const status: "thinking" | "building" =
    generation.phase === "thinking" ? "thinking" : "building";
  const label = status === "thinking" ? "Thinking..." : "Building...";

  return (
    <div className={`wa-animate-fade-up mt-4 flex ${centered ? "justify-start" : "justify-start"}`}>
      <div className="wa-chat-bubble-ai max-w-[88%] rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            key={status}
            className="wa-status-enter text-sm font-medium"
            style={{ animation: "wa-thinking-pulse 1.5s ease-in-out infinite" }}
          >
            {label}
          </span>
          <div className="flex gap-1">
            <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
            <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
            <span className="wa-thinking-dot h-1.5 w-1.5 rounded-full bg-brand-green" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  isTyping,
  onTypingComplete,
  centered,
  showInlineQuestion,
  onQuestionAnswer,
}: {
  message: ChatMessage;
  isTyping: boolean;
  onTypingComplete: () => void;
  centered?: boolean;
  showInlineQuestion?: boolean;
  onQuestionAnswer?: (questionId: GatheringQuestionId, answer: WebsiteQuestionnaireAnswer) => void;
}) {
  const isUser = message.role === "user";
  const hasAttachments = Boolean(message.attachments?.length);

  if (
    showInlineQuestion &&
    message.questionId &&
    message.questionOptions &&
    onQuestionAnswer
  ) {
    return (
      <ConversationQuestion
        question={message.content}
        questionId={message.questionId}
        options={message.questionOptions}
        otherPlaceholder={message.otherPlaceholder}
        onAnswer={onQuestionAnswer}
        centered={centered}
      />
    );
  }

  return (
    <div className={`wa-animate-fade-up mb-4 flex ${isUser ? "justify-end" : centered ? "justify-start" : "justify-start"}`}>
      {!isUser && !centered && (
        <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-green/10">
          <BotIcon className="h-4 w-4 text-brand-green" />
        </div>
      )}
      <div className={`flex max-w-[85%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        {hasAttachments && message.attachments && (
          <ChatMessageAttachments attachments={message.attachments} align={isUser ? "end" : "start"} />
        )}
        {message.content ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser ? "wa-chat-bubble-user rounded-br-md text-white" : "wa-chat-bubble-ai rounded-bl-md text-defaulttextcolor"
            }`}
          >
            {isTyping ? <TypingMessage text={message.content} onComplete={onTypingComplete} /> : message.content}
          </div>
        ) : null}
      </div>
    </div>
  );
}
