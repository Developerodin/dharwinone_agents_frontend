import { getToken, handleUnauthorized } from "@/lib/auth";

const BASE = (process.env.NEXT_PUBLIC_TELEPHONY_API_URL ?? "http://localhost:8788").trim();

export type TelephonyCallRecord = {
  _id: string;
  executionId: string;
  status: string;
  toPhoneNumber?: string;
  fromPhoneNumber?: string;
  duration?: number;
  recordingUrl?: string;
  notes?: string;
  tags?: string[];
  telephonyData?: { provider?: string; direction?: string };
  createdAt: string;
  completedAt?: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...((init?.headers as Record<string, string>) ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Telephony session expired");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Telephony request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchDialerToken() {
  return request<{ token: string; identity: string; ttl: number }>(
    "/api/telephony/token",
    { method: "POST" },
  );
}

export function fetchCallRecords(limit = 100) {
  return request<{ results: TelephonyCallRecord[]; total: number }>(
    `/api/telephony/call-records?limit=${limit}`,
  );
}

export async function fetchRecordingBlobUrl(callSid: string): Promise<string> {
  const token = getToken();
  const res = await fetch(
    `${BASE}/api/telephony/call-records/${encodeURIComponent(callSid)}/recording`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Telephony session expired");
  }
  if (!res.ok) {
    throw new Error(`Recording fetch failed (${res.status})`);
  }
  return URL.createObjectURL(await res.blob());
}
