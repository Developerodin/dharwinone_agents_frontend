// Port of backend/studio/repositories/conversations_repo.py — same function
// surface, same returned shapes (camelCase, no `id`).
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { toDoc } from "./doc";

export type Turn = Record<string, unknown> & {
  role: string;
  text: unknown;
  ts: number;
  meta: Record<string, unknown>;
};

export type ConversationDoc = Record<string, unknown> & {
  projectId: string;
  turns: Turn[];
};

export async function ensure(projectId: string): Promise<ConversationDoc> {
  const row = await prisma().conversations.findFirst({ where: { projectId } });
  if (row) return toDoc(row) as ConversationDoc;
  const created = await prisma().conversations.create({
    data: { projectId, turns: [] },
  });
  return toDoc(created) as ConversationDoc;
}

export async function appendTurn(
  projectId: string,
  role: string,
  text: unknown,
  meta?: Record<string, unknown> | null,
): Promise<Turn> {
  const turn: Turn = {
    role,
    text,
    ts: Date.now() / 1000,
    meta: meta ?? {},
  };
  const row = await prisma().conversations.findFirst({ where: { projectId } });
  const turns = [...((row?.turns as Turn[] | null) ?? []), turn];
  const turnsJson = turns as unknown as Prisma.InputJsonValue;
  if (row) {
    await prisma().conversations.update({ where: { projectId }, data: { turns: turnsJson } });
  } else {
    await prisma().conversations.create({ data: { projectId, turns: turnsJson } });
  }
  return turn;
}

export async function listTurns(projectId: string): Promise<Turn[]> {
  const doc = await ensure(projectId);
  return [...(doc.turns ?? [])];
}
