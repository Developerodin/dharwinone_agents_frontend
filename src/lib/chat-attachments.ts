import type { ChatAttachment, ChatAttachmentKind } from "@/lib/web-agent-data";

const MAX_ATTACHMENTS = 6;
const MAX_FILE_BYTES = 12 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAttachmentKind(file: File): ChatAttachmentKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return "pdf";
  return null;
}

export function isAcceptedChatFile(file: File): boolean {
  return getAttachmentKind(file) !== null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function fileToChatAttachment(file: File): Promise<ChatAttachment | null> {
  const kind = getAttachmentKind(file);
  if (!kind || file.size > MAX_FILE_BYTES) return null;

  const url = await readFileAsDataUrl(file);
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    kind,
    mimeType: file.type || (kind === "pdf" ? "application/pdf" : "image/*"),
    size: file.size,
    url,
  };
}

export async function filesToChatAttachments(files: FileList | File[]): Promise<ChatAttachment[]> {
  const accepted = Array.from(files).filter(isAcceptedChatFile);
  const results = await Promise.all(accepted.map(fileToChatAttachment));
  return results.filter((item): item is ChatAttachment => item !== null);
}

export function mergeAttachments(existing: ChatAttachment[], incoming: ChatAttachment[]): ChatAttachment[] {
  const seen = new Set(existing.map((a) => a.id));
  const merged = [...existing];
  for (const attachment of incoming) {
    if (seen.has(attachment.id)) continue;
    merged.push(attachment);
    seen.add(attachment.id);
  }
  return merged.slice(0, MAX_ATTACHMENTS);
}

export const CHAT_ATTACHMENT_ACCEPT = "image/*,.pdf,application/pdf";
