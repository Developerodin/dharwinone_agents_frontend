"use client";

import { useEffect, useState } from "react";
import type { ChatAttachment } from "@/lib/web-agent-data";
import { formatFileSize } from "@/lib/chat-attachments";
import { FileTextIcon, ImageIcon, XIcon } from "@/components/icons";

type ImagePreviewModalProps = {
  attachment: ChatAttachment;
  onClose: () => void;
};

export function ImagePreviewModal({ attachment, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="wa-attachment-modal fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm wa-animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${attachment.name}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Close preview"
      >
        <XIcon className="h-5 w-5" />
      </button>
      <div className="wa-animate-scale-in max-h-[90vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
        <p className="m-0 mt-3 text-center text-sm text-white/80">{attachment.name}</p>
      </div>
    </div>
  );
}

function PdfAttachmentCard({
  attachment,
  onOpen,
  compact,
}: {
  attachment: ChatAttachment;
  onOpen?: () => void;
  compact?: boolean;
}) {
  const content = (
    <>
      <div className={`flex shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 ${compact ? "h-9 w-9" : "h-11 w-11"}`}>
        <FileTextIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`m-0 truncate font-medium text-defaulttextcolor ${compact ? "text-xs" : "text-sm"}`}>{attachment.name}</p>
        <p className="m-0 mt-0.5 text-[0.6875rem] text-textmuted">
          PDF · {formatFileSize(attachment.size)}
        </p>
      </div>
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`wa-chat-attachment-pdf flex w-full items-center gap-3 text-left transition-all hover:border-brand-green/30 hover:bg-brand-green/5 ${compact ? "rounded-xl border border-defaultborder/50 bg-light/80 p-2.5" : "rounded-2xl border border-defaultborder/50 bg-white p-3 shadow-sm"}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`wa-chat-attachment-pdf flex items-center gap-3 ${compact ? "rounded-xl border border-defaultborder/50 bg-light/80 p-2.5" : "rounded-2xl border border-defaultborder/50 bg-white p-3 shadow-sm"}`}>
      {content}
    </div>
  );
}

function ImageAttachmentThumb({
  attachment,
  onPreview,
  compact,
}: {
  attachment: ChatAttachment;
  onPreview: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPreview}
      className={`wa-chat-attachment-image group relative overflow-hidden border border-defaultborder/40 bg-light transition-all hover:border-brand-green/40 hover:shadow-md ${compact ? "h-16 w-16 rounded-xl" : "h-36 w-44 rounded-2xl sm:h-40 sm:w-52"}`}
      title={`Preview ${attachment.name}`}
    >
      <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/45 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="flex items-center gap-1 text-[0.625rem] font-medium text-white">
          <ImageIcon className="h-3 w-3" />
          Preview
        </span>
      </div>
    </button>
  );
}

export function ChatMessageAttachments({
  attachments,
  align = "end",
}: {
  attachments: ChatAttachment[];
  align?: "start" | "end";
}) {
  const [previewImage, setPreviewImage] = useState<ChatAttachment | null>(null);

  if (!attachments.length) return null;

  return (
    <>
      <div className={`mb-2 flex flex-col gap-2 ${align === "end" ? "items-end" : "items-start"}`}>
        {attachments.map((attachment) =>
          attachment.kind === "image" ? (
            <ImageAttachmentThumb
              key={attachment.id}
              attachment={attachment}
              onPreview={() => setPreviewImage(attachment)}
            />
          ) : (
            <div key={attachment.id} className="w-full max-w-[240px]">
              <PdfAttachmentCard
                attachment={attachment}
                onOpen={() => window.open(attachment.url, "_blank", "noopener,noreferrer")}
              />
            </div>
          )
        )}
      </div>
      {previewImage && <ImagePreviewModal attachment={previewImage} onClose={() => setPreviewImage(null)} />}
    </>
  );
}

export function ComposerAttachmentPreview({
  attachments,
  onRemove,
}: {
  attachments: ChatAttachment[];
  onRemove: (id: string) => void;
}) {
  const [previewImage, setPreviewImage] = useState<ChatAttachment | null>(null);

  if (!attachments.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 px-4 pt-3">
        {attachments.map((attachment) =>
          attachment.kind === "image" ? (
            <div key={attachment.id} className="wa-animate-scale-in relative">
              <button
                type="button"
                onClick={() => setPreviewImage(attachment)}
                className="wa-chat-attachment-image h-16 w-16 overflow-hidden rounded-xl border border-defaultborder/50"
              >
                <img src={attachment.url} alt={attachment.name} className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(attachment.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-defaultborder/40 bg-white text-textmuted shadow-sm hover:text-danger"
                aria-label={`Remove ${attachment.name}`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div key={attachment.id} className="wa-animate-scale-in relative w-full max-w-[220px]">
              <PdfAttachmentCard attachment={attachment} compact />
              <button
                type="button"
                onClick={() => onRemove(attachment.id)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-defaultborder/40 bg-white text-textmuted shadow-sm hover:text-danger"
                aria-label={`Remove ${attachment.name}`}
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          )
        )}
      </div>
      {previewImage && <ImagePreviewModal attachment={previewImage} onClose={() => setPreviewImage(null)} />}
    </>
  );
}
