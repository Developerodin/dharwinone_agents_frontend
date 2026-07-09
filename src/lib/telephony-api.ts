const BASE = process.env.NEXT_PUBLIC_TELEPHONY_API_URL ?? "http://localhost:8788";

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
  const res = await fetch(`${BASE}${path}`, init);
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

export function recordingStreamUrl(callSid: string) {
  return `${BASE}/api/telephony/call-records/${encodeURIComponent(callSid)}/recording`;
}
